import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { getRedis } from '@/lib/redis/upstash'
import { activateBuoyPolicy } from '@/lib/buoy/client'
import { sendPushToAllGuests } from '@/lib/notifications/push'
import { auditLog } from '@/lib/security/audit'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

const startSchema = z.object({
  snapshotToken: z.string().min(10),
  captainName: z.string().max(100).optional(),
  confirmedGuestCount: z.number().int().min(0),
  checklistConfirmed: z.boolean().refine(
    v => v === true,
    { message: 'Pre-departure checklist must be confirmed' }
  ),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // ── Rate limit: 5 start attempts per hour per IP
  const limited = await rateLimit(req, {
    max: 5, window: 3600,
    key: `trip:start:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ── Parse and validate body ──────────────
  const body = await req.json().catch(() => null)
  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // ── Verify snapshot token ────────────────
  const tokenResult = verifySnapshotToken(data.snapshotToken)
  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Invalid or tampered token' },
      { status: 401 }
    )
  }
  if (tokenResult.expired) {
    return NextResponse.json(
      { error: 'This link has expired. Ask the operator to send a new one.' },
      { status: 401 }
    )
  }

  const tripId = tokenResult.tripId
  const supabase = createServiceClient()

  // ── Fetch trip to verify slug matches token ──
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select(`
      id, slug, status, trip_date, departure_time,
      duration_hours, max_guests, operator_id,
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, lat, lng, captain_name,
        safety_cards
      ),
      guests (
        id, waiver_signed, waiver_text_hash,
        safety_acknowledgments, approval_status
      )
    `)
    .eq('id', tripId)
    .eq('slug', slug)
    .is('guests.deleted_at', null)
    .single()

  if (tripErr || !trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    )
  }

  // ── Already active — idempotent ──────────
  if (trip.status === 'active') {
    const { data: existing } = await supabase
      .from('trips')
      .select('started_at, buoy_policy_id, guest_count_at_start')
      .eq('id', tripId)
      .single()

    return NextResponse.json({
      data: {
        alreadyStarted: true,
        startedAt: existing?.started_at,
        buoyPolicyId: existing?.buoy_policy_id,
      },
    })
  }

  // ── Trip must be upcoming to start ───────
  if (trip.status !== 'upcoming') {
    return NextResponse.json(
      { error: `Cannot start a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  // ── Acquire Redis distributed lock ───────
  // Prevents two simultaneous start requests
  const redis = getRedis()
  const lockKey = `lock:trip:start:${tripId}`

  const acquired = await redis.set(
    lockKey,
    '1',
    { ex: 30, nx: true }    // Only set if NOT exists
  ).catch(() => null)

  if (!acquired) {
    // Lock exists — another start is in progress
    return NextResponse.json(
      { error: 'Trip start already in progress. Please wait.' },
      { status: 409 }
    )
  }

  const startedAt = new Date().toISOString()
  const boat = trip.boats as any

  try {
    // ── LAYER 9.5: USCG PRE-DEPARTURE SAFETY COMPLIANCE ──────
    // Server-side enforcement: independently verify every guest
    // has signed the waiver and completed all required safety cards.
    // This guard is the last line of defense even if the UI is bypassed.
    const boatData = trip.boats as unknown as Record<string, unknown>
    const safetyCards = (boatData?.safety_cards as unknown[]) ?? []
    const requiredSafetyCards = safetyCards.length
    const tripGuests = (trip.guests ?? []) as Record<string, unknown>[]

    const nonCompliantGuests = tripGuests.filter(g => {
      const hasWaiver = (g.waiver_signed as boolean) ||
                        (g.waiver_text_hash as string) === 'firma_template'
      const safetyAcks = (g.safety_acknowledgments as unknown[]) ?? []
      const hasSafety = safetyAcks.length >= requiredSafetyCards
      const isApproved = (g.approval_status as string) !== 'pending'
      return !(hasWaiver && hasSafety && isApproved)
    })

    if (nonCompliantGuests.length > 0) {
      // Release lock before returning
      await redis.del(lockKey).catch(() => null)
      return NextResponse.json(
        {
          error: `Pre-departure safety check failed. ${nonCompliantGuests.length} guest(s) are missing waivers or safety acknowledgments.`,
          code: 'SAFETY_COMPLIANCE_FAILED',
          nonCompliantCount: nonCompliantGuests.length,
        },
        { status: 400 }
      )
    }

    // ── STEP 1: Update trip status ───────────
    // This is the source of truth — do first
    const { error: updateErr } = await supabase
      .from('trips')
      .update({
        status: 'active',
        started_at: startedAt,
        started_by_captain: data.captainName
          ?? boat?.captain_name
          ?? 'Captain',
        guest_count_at_start: data.confirmedGuestCount,
      })
      .eq('id', tripId)
      .eq('status', 'upcoming') // Extra safety: only update if still upcoming

    if (updateErr) {
      throw new Error(`DB update failed: ${updateErr.message}`)
    }

    // ── STEP 2: Buoy API (non-blocking on failure) ──
    let buoyResult = null
    try {
      buoyResult = await activateBuoyPolicy({
        tripId,
        operatorId: trip.operator_id,
        guestCount: data.confirmedGuestCount,
        boatType: boat?.boat_type ?? 'other',
        boatName: boat?.boat_name ?? 'Unknown',
        marinaLat: boat?.lat ? Number(boat.lat) : null,
        marinaLng: boat?.lng ? Number(boat.lng) : null,
        tripDate: trip.trip_date,
        durationHours: trip.duration_hours,
      })

      // Save policy ID
      if (buoyResult.policyId) {
        await supabase
          .from('trips')
          .update({ buoy_policy_id: buoyResult.policyId })
          .eq('id', tripId)
      }
    } catch (buoyErr) {
      // Buoy failure NEVER blocks trip start
      console.error('[start] Buoy API failed:', buoyErr)
      // Log for manual follow-up
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'buoy_activation_failed',
        title: 'Insurance activation needs attention',
        body: 'Buoy API could not activate automatically. Contact support.',
        data: { tripId },
      })
    }

    // ── STEP 3: Audit log (USCG departure record) ──
    await auditLog({
      action: 'trip_started',
      operatorId: trip.operator_id,
      actorType: 'captain',
      actorIdentifier: data.captainName ?? 'Captain Token',
      entityType: 'trip',
      entityId: tripId,
      changes: {
        startedAt,
        guestCount: data.confirmedGuestCount,
        captainName: data.captainName,
        buoyPolicyId: buoyResult?.policyId ?? null,
        buoyPolicyNumber: buoyResult?.policyNumber ?? null,
        marinaName: boat?.marina_name,
        lat: boat?.lat,
        lng: boat?.lng,
      },
    })

    // ── STEP 4: Push to all guests (non-blocking) ──
    sendPushToAllGuests(tripId, {
      title: `⚓ Your charter has started!`,
      body: `Welcome aboard ${boat?.boat_name ?? 'your charter'}. Have an amazing trip!`,
      icon: '/icons/icon-192.png',
      url: `/trip/${slug}`,
      tag: `trip-started-${tripId}`,
    }).catch(() => null)

    // ── STEP 5: Notify operator dashboard ───
    // Supabase Realtime broadcasts to dashboard
    void supabase.from('operator_notifications').insert({
      operator_id: trip.operator_id,
      type: 'trip_started',
      title: '⚓ Trip started',
      body: `${boat?.boat_name} has departed with ${data.confirmedGuestCount} guests`,
      data: { tripId, slug: trip.slug },
    })

    return NextResponse.json({
      data: {
        started: true,
        startedAt,
        buoyPolicyId: buoyResult?.policyId ?? null,
        buoyPolicyNumber: buoyResult?.policyNumber ?? null,
        buoyStatus: buoyResult?.status ?? 'unknown',
      },
    })

  } catch (err: any) {
    console.error('[trip:start] critical error:', err.message)

    // Attempt to roll back if DB update caused the error
    await supabase
      .from('trips')
      .update({ status: 'upcoming', started_at: null })
      .eq('id', tripId)
      .eq('started_at', startedAt)

    return NextResponse.json(
      { error: 'Failed to start trip. Please try again.' },
      { status: 500 }
    )
  } finally {
    // ALWAYS release lock
    await redis.del(lockKey).catch(() => null)
  }
}
