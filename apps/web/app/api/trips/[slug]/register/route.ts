import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { verifyWaiverHash } from '@/lib/security/waiver'
import { auditLog } from '@/lib/security/audit'
import { sanitiseText } from '@/lib/security/sanitise'
import { guestRegistrationSchema } from '@/lib/security/sanitise'
import { generateQRToken } from '@/lib/security/tokens'
import { queueCaptainSnapshot } from '@/lib/notifications/smsQueue'
import { smsTemplates } from '@/lib/notifications/sms-templates'
import { generateSnapshotToken } from '@/lib/security/snapshot'
import { redis, CACHE_KEYS } from '@/lib/redis/client'
import crypto from 'crypto'
import { getRedis } from '@/lib/redis/upstash'
import { invalidateTripCache } from '@/lib/redis/cache'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  // ── LAYER 1: Global IP rate limit ────────────────────────────────────────
  // Max 10 registrations per IP per hour
  const ipLimited = await rateLimit(req, {
    max: 10,
    window: 3600,
    key: `register:ip:${ip}`,
  })
  if (ipLimited.blocked) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  // ── LAYER 2: Parse body ───────────────────────────────────────────────────
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  // ── LAYER 3: Schema validation ────────────────────────────────────────────
  const parsed = guestRegistrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  // ── LAYER 4: Slug/body cross-check ────────────────────────────────────────
  if (data.tripSlug !== slug) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // ── LAYER 5: Turnstile bot protection ────────────────────────────────────
  const botCheck = await verifyTurnstile(data.turnstileToken)
  if (!botCheck) {
    return NextResponse.json(
      { error: 'Bot check failed. Please refresh and try again.' },
      { status: 403 }
    )
  }

  // ── LAYER 6: Trip code lockout check ─────────────────────────────────────
  const redis = getRedis()
  const attemptsKey = `rate:code:${slug}:${ip}`
  const lockKey = `lock:code:${slug}:${ip}`

  const locked = await redis.get(lockKey).catch(() => null)
  if (locked) {
    const lockTTL = await redis.ttl(lockKey).catch(() => 1800)
    return NextResponse.json(
      { error: 'Too many wrong codes. Try again later.', lockSeconds: lockTTL },
      { status: 429 }
    )
  }

  const supabase = createServiceClient()

  // ── LAYER 7: Fetch trip ───────────────────────────────────────────────────
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_code, max_guests, status,
      operator_id, boat_id, requires_approval,
      charter_type, trip_date, departure_time,
      boats ( waiver_text )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .neq('status', 'completed')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found or no longer available' },
      { status: 404 }
    )
  }

  // ── LAYER 8: Verify trip code (with Lua atomic increment) ────────────────
  if (data.tripCode.toUpperCase() !== trip.trip_code.toUpperCase()) {
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], 300)
      end
      if current >= 5 then
        redis.call('SET', KEYS[2], '1')
        redis.call('EXPIRE', KEYS[2], 1800)
      end
      return current
    `
    const attempts = await redis
      .eval(luaScript, [attemptsKey, lockKey], [])
      .catch(() => 0) as number

    const remaining = Math.max(0, 5 - Number(attempts))
    return NextResponse.json(
      {
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many wrong codes. Try again in 30 minutes.',
        remaining,
      },
      { status: 400 }
    )
  }

  // Code correct — reset attempt counter
  await redis.del(attemptsKey).catch(() => null)

  // ── LAYER 9: Capacity check ───────────────────────────────────────────────
  const { count: guestCount } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)

  if ((guestCount ?? 0) >= trip.max_guests) {
    return NextResponse.json(
      { error: 'This trip is full' },
      { status: 409 }
    )
  }

  // ── LAYER 10: Idempotency check ───────────────────────────────────────────
  // Same name registered within 15 minutes → return existing pass silently
  const recentCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('guests')
    .select('id, qr_token, created_at')
    .eq('trip_id', trip.id)
    .ilike('full_name', data.fullName.trim())
    .is('deleted_at', null)
    .gte('created_at', recentCutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      data: {
        guestId: existing.id,
        qrToken: existing.qr_token,
        isDuplicate: true,
        requiresCourse: shouldRequireCourse(data.dateOfBirth, trip.charter_type as string),
      },
    })
  }

  // ── LAYER 11: Verify waiver hash ──────────────────────────────────────────
  // Firma-signed waivers are verified by Firma's platform, not by text hash.
  // The 'firma_template' literal is whitelisted in guestRegistrationSchema (Zod).
  const isFirmaSigned = data.waiverTextHash === 'firma_template'
  const waiverText = (trip.boats as { waiver_text?: string | null } | null)
    ?.waiver_text ?? null

  if (waiverText && !isFirmaSigned && !verifyWaiverHash(data.waiverTextHash, waiverText)) {
    return NextResponse.json(
      { error: 'The waiver has been updated. Please reload and try again.' },
      { status: 409 }
    )
  }

  // ── LAYER 12: Generate QR token + insert guest ────────────────────────────
  const guestId = crypto.randomUUID()
  const tripDate = trip.trip_date ?? new Date().toISOString().split('T')[0]!
  const qrToken = generateQRToken(guestId, trip.id, tripDate)

  // ── Bareboat/Livery compliance (FWC Ch.327) ────────────────────────────────
  // Bareboat renters ALWAYS require in-person vessel briefing from dockmaster,
  // regardless of FWC license status. They cannot be auto-approved.
  const isBareboat = trip.charter_type === 'bareboat' || trip.charter_type === 'both'
  const approvalStatus = isBareboat
    ? 'pending_livery_briefing'
    : trip.requires_approval
      ? 'pending'
      : 'auto_approved'

  const { error: insertError } = await supabase
    .from('guests')
    .insert({
      id: guestId,
      trip_id: trip.id,
      operator_id: trip.operator_id,
      full_name: sanitiseText(data.fullName),
      phone: data.phone.replace(/[^\d+\s()\-.]/g, ''),
      emergency_contact_name: sanitiseText(data.emergencyContactName),
      emergency_contact_phone: data.emergencyContactPhone.replace(/[^\d+\s()\-.]/g, ''),
      dietary_requirements: data.dietaryRequirements
        ? sanitiseText(data.dietaryRequirements)
        : null,
      language_preference: data.languagePreference,
      date_of_birth: data.dateOfBirth ?? null,
      is_non_swimmer: data.isNonSwimmer ?? false,
      is_seasickness_prone: data.isSeaSicknessProne ?? false,
      gdpr_consent: data.gdprConsent ?? false,
      marketing_consent: data.marketingConsent ?? false,
      safety_acknowledgments: data.safetyAcknowledgments,
      waiver_signed: true,
      waiver_signed_at: new Date().toISOString(),
      waiver_signature_text: sanitiseText(data.waiverSignatureText),
      waiver_text_hash: data.waiverTextHash,
      waiver_ip_address: ip,
      waiver_user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      approval_status: approvalStatus,
      qr_token: qrToken,
      fwc_license_url: data.fwcLicenseUrl ?? null,
    })

  if (insertError) {
    // Race condition: unique constraint violation
    if (insertError.code === '23505') {
      const newQrToken = generateQRToken(guestId, trip.id, tripDate)
      return NextResponse.json({
        data: {
          guestId,
          qrToken: newQrToken,
          isDuplicate: false,
          requiresCourse: shouldRequireCourse(data.dateOfBirth, trip.charter_type as string),
        },
      })
    }
    console.error('[register] insert failed:', insertError.code)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  // ── LAYER 13: Post-registration tasks (all non-blocking) ─────────────────
  invalidateTripCache(slug).catch(() => null)

  auditLog({
    action: 'guest_registered',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'guest',
    entityId: guestId,
    changes: {
      tripId: trip.id,
      operatorId: trip.operator_id,
      language: data.languagePreference,
      approvalStatus,
      safetyCardsAcknowledged: data.safetyAcknowledgments.length,
    },
  })

  // Notify operator (non-blocking — table may not exist yet)
  void supabase
    .from('operator_notifications')
    .insert({
      operator_id: trip.operator_id,
      type: 'guest_registered',
      title: 'New guest checked in',
      body: `${data.fullName} registered for your trip`,
      data: { tripId: trip.id, guestId },
    })

  // SMS Trigger A: All guests checked in?
  // We recount guests asynchronously
  supabase
    .from('guests')
    .select('id', { count: 'exact' })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)
    .then(async ({ count, error }) => {
      if (error) return
      if (count === trip.max_guests) {
        // Find captain phone
        const { data: tripData } = await supabase
          .from('trips')
          .select(`
             boats(boat_name),
             trip_assignments(captains(phone))
          `)
          .eq('id', trip.id)
          .single()
        
        const captainPhone = (tripData?.trip_assignments as any)?.[0]?.captains?.phone
        if (captainPhone) {
          // Generate token
          const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
          const fullToken = generateSnapshotToken(trip.id, expiresAt)
          
          // Generate 8-char short token
          const shortToken = crypto.createHash('sha256').update(fullToken).digest('hex').substring(0, 8)
          await redis.set(CACHE_KEYS.shortUrlToken(shortToken), fullToken, { ex: 21600 })
          
          const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortToken}`
          const tDate = formatTripDate(tripDate) 
          const tTime = formatTime(trip.departure_time || '09:00:00')

          const body = smsTemplates.captainSnapshotReady({
            boatName: (tripData?.boats as any)?.boat_name || 'Vessel',
            date: tDate,
            time: tTime,
            checkedIn: count,
            total: trip.max_guests,
            shortUrl,
            code: trip.trip_code || 'CODE'
          })
          
          await queueCaptainSnapshot(trip.id, captainPhone, body)
        }
      }
    })

  return NextResponse.json({
    data: {
      guestId,
      qrToken,
      isDuplicate: false,
      approvalStatus,
      requiresCourse: shouldRequireCourse(data.dateOfBirth, trip.charter_type as string),
    },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTripDate(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(timeString: string) {
  const [h, m] = timeString.split(':')
  let hours = parseInt(h || '9')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${m} ${ampm}`
}

/**
 * Florida law: boat operators born on or after Jan 1, 1988
 * must complete an approved safety course.
 * Only applies to bareboat / both charter types.
 */
function shouldRequireCourse(
  dob: string | undefined,
  charterType: string
): boolean {
  if (charterType === 'captained') return false
  if (!dob) return false
  return new Date(dob) >= new Date('1988-01-01')
}
