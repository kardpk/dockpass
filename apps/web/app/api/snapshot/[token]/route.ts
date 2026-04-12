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

  // Check Redis cache (1min TTL)
  const redis = getRedis()
  const cacheKey = `cache:snapshot:${token}`
  try {
    const cached = await redis.get<CaptainSnapshotData>(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached })
    }
  } catch {}

  // Fetch live from DB
  const supabase = createServiceClient()
  const { data: raw } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, trip_code, status, started_at, charter_type, requires_approval,
      special_notes, buoy_policy_id,
      boats (
        id, boat_name, boat_type, marina_name, marina_address,
        slip_number, captain_name, lat, lng, waiver_text, safety_cards
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
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

  const snapshot: CaptainSnapshotData = {
    tripId,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    maxGuests: trip.maxGuests,
    requiredSafetyCards: trip.boat.safetyCards?.length ?? 0,
    marinaName: trip.boat.marinaName,
    slipNumber: trip.boat.slipNumber,
    tripDate: trip.tripDate,
    departureTime: trip.departureTime,
    durationHours: trip.durationHours,
    captainName: trip.boat.captainName,
    weather: null,
    alerts,
    guests: trip.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      waiverSigned: g.waiverSigned,
      waiverTextHash: g.waiverTextHash ?? null,
      safetyAckCount: g.safetyAcknowledgments?.length ?? 0,
      languageFlag: LANGUAGE_FLAGS[g.languagePreference as keyof typeof LANGUAGE_FLAGS] ?? '🌐',
      addonEmojis: g.addonOrders.map(o => o.emoji),
    })),
    addonSummary,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }

  // Cache 1 min
  redis.set(cacheKey, snapshot, { ex: 60 }).catch(() => null)

  return NextResponse.json({ data: snapshot })
}
