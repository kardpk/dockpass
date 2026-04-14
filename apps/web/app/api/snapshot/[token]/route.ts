import { NextRequest, NextResponse } from 'next/server'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { getRedis } from '@/lib/redis/upstash'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { shapeTripDetail, buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import type { CaptainSnapshotData } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Rate limit: 60/min per IP
  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `snapshot:view`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' }, { status: 429 }
    )
  }

  // Verify token
  const tokenResult = verifySnapshotToken(token)
  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Invalid token' }, { status: 401 }
    )
  }
  if (tokenResult.expired) {
    return NextResponse.json(
      { error: 'expired' }, { status: 401 }
    )
  }

  const tripId = tokenResult.tripId

  // ── BUG-1 FIX: Verify token version against DB ──────────────
  // Without this check, a revoked token (version bumped by operator)
  // continues serving data via polls until the Redis cache expires.
  const supabase = createServiceClient()

  const { data: versionRow } = await supabase
    .from('trips')
    .select('captain_token_version')
    .eq('id', tripId)
    .single()

  // Parse version from token payload
  try {
    const tokenPayload = JSON.parse(
      Buffer.from(token.split('.')[0]!, 'base64url').toString()
    ) as { version?: number }

    if (
      versionRow?.captain_token_version != null &&
      tokenPayload.version != null &&
      versionRow.captain_token_version !== tokenPayload.version
    ) {
      // Purge stale cache immediately
      const redis = getRedis()
      await redis.del(`cache:snapshot:${token}`).catch(() => null)
      return NextResponse.json(
        { error: 'Token has been revoked' }, { status: 401 }
      )
    }
  } catch {
    // Token payload parsing failed — continue (HMAC already verified)
  }

  // Check Redis cache (1min TTL)
  const redis = getRedis()
  const cacheKey = `cache:snapshot:${token}`
  try {
    const cached = await redis.get<CaptainSnapshotData>(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached })
    }
  } catch {}

  // Fetch live from DB (reuse supabase client from version check above)
  const { data: raw } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, trip_code, status, started_at, charter_type, requires_approval,
      special_notes, trip_purpose, force_full_compliance,
      boats (
        id, boat_name, boat_type, marina_name, marina_address,
        slip_number, captain_name, lat, lng, waiver_text, safety_cards, length_ft, state_code
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, date_of_birth, is_non_swimmer,
        is_seasickness_prone, waiver_signed, waiver_signed_at,
        checked_in_at, approval_status, created_at,
        safety_acknowledgments, waiver_text_hash,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      ),
      bookings (
        id, organiser_name, organiser_email, max_guests, booking_code, notes
      )
    `)
    .eq('id', tripId)
    .is('guests.deleted_at', null)
    .single()

  if (!raw) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  const trip = shapeTripDetail(raw as Record<string, unknown>)
  const alerts = buildCaptainAlerts(trip.guests)
  const addonSummary = buildAddonSummary(trip.guests)

  // ── Captain Resolution: trip_assignments → boat default ──
  const { data: assignments } = await supabase
    .from('trip_assignments')
    .select(`
      role,
      captains (
        full_name, photo_url, license_number, license_type,
        phone, email
      )
    `)
    .eq('trip_id', tripId)
    .order('role')

  const primaryCaptain = assignments?.find(a => a.role === 'captain')
  const captainData = primaryCaptain?.captains as unknown as Record<string, unknown> | null

  const resolvedCaptainName = (captainData?.full_name as string)
    ?? trip.boat.captainName
    ?? null
  const resolvedCaptainPhoto = (captainData?.photo_url as string)
    ?? (trip.boat as Record<string, unknown>).captainPhotoUrl as string
    ?? null
  const resolvedCaptainLicense = (captainData?.license_number as string)
    ?? (trip.boat as Record<string, unknown>).captainLicense as string
    ?? null
  const resolvedCaptainRole = primaryCaptain?.role ?? 'captain'

  const crewManifest = (assignments ?? []).map(a => ({
    name: (a.captains as unknown as Record<string, unknown>)?.full_name as string ?? 'Unknown',
    role: a.role as string,
    license: (a.captains as unknown as Record<string, unknown>)?.license_number as string ?? null,
  }))

  const snapshot: CaptainSnapshotData = {
    tripId,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    maxGuests: trip.maxGuests,
    requiredSafetyCards: (() => {
      const cards = (trip.boat.safetyCards ?? []) as { compliance_target?: string; max_length_ft?: number; min_length_ft?: number }[]
      const charterType = (raw as Record<string, unknown>).charter_type as string ?? 'captained'
      const lengthFt = (trip.boat as Record<string, unknown>).lengthFt as number | null ?? null
      return cards.filter(c => {
        const target = c.compliance_target ?? 'all'
        if (target === 'bareboat_only' && charterType === 'captained') return false
        if (target === 'passengers_only' && charterType !== 'captained') return false
        if (c.max_length_ft && lengthFt != null && lengthFt >= c.max_length_ft) return false
        if (c.min_length_ft && lengthFt != null && lengthFt < c.min_length_ft) return false
        return true
      }).length
    })(),
    marinaName: trip.boat.marinaName,
    slipNumber: trip.boat.slipNumber,
    tripDate: trip.tripDate,
    departureTime: trip.departureTime,
    durationHours: trip.durationHours,
    captainName: resolvedCaptainName,
    stateCode: (trip.boat as Record<string, unknown>).stateCode as string ?? '',
    boatType: (trip.boat as Record<string, unknown>).boatType as string ?? 'other',
    charterType: (raw as Record<string, unknown>).charter_type as string ?? 'captained',
    lengthFt: (trip.boat as Record<string, unknown>).lengthFt as number | null ?? null,
    weather: null,
    alerts,
    guests: trip.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      dateOfBirth: g.dateOfBirth ?? null,
      waiverSigned: g.waiverSigned,
      waiverTextHash: g.waiverTextHash ?? null,
      safetyAckCount: g.safetyAcknowledgments?.length ?? 0,
      languageFlag: LANGUAGE_FLAGS[g.languagePreference as keyof typeof LANGUAGE_FLAGS] ?? '🌐',
      addonEmojis: g.addonOrders.map(o => o.emoji),
      approvalStatus: g.approvalStatus ?? 'auto_approved',
      fwcLicenseUrl: g.fwcLicenseUrl ?? null,
      liveryBriefingVerifiedAt: g.liveryBriefingVerifiedAt ?? null,
      liveryBriefingVerifiedBy: g.liveryBriefingVerifiedBy ?? null,
    })),
    addonSummary,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    captainPhotoUrl: resolvedCaptainPhoto,
    captainLicense: resolvedCaptainLicense,
    captainRole: resolvedCaptainRole,
    crewManifest,
    tripPurpose: ((raw as Record<string, unknown>).trip_purpose as string ?? 'commercial') as import('@/types').TripPurpose,
    forceFullCompliance: (raw as Record<string, unknown>).force_full_compliance as boolean ?? false,
  }

  // Cache 1 min
  redis.set(cacheKey, snapshot, { ex: 60 }).catch(() => null)

  return NextResponse.json({ data: snapshot })
}
