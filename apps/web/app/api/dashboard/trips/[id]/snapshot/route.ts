import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { generateSnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import type { CaptainSnapshotData } from '@/types'
import { buildCaptainAlerts, buildAddonSummary, shapeTripDetail } from '@/lib/dashboard/getDashboardData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 20, window: 3600,
    key: `snapshot:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, status, charter_type,
      boats (
        boat_name, marina_name, slip_number,
        captain_name, lat, lng, waiver_text, safety_cards
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        approval_status, created_at,
        safety_acknowledgments, waiver_text_hash,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = shapeTripDetail(raw as Record<string, unknown>)
  const alerts = buildCaptainAlerts(trip.guests)
  const addonSummary = buildAddonSummary(trip.guests)
  const token = generateSnapshotToken(id)

  const now = new Date()
  const expires = new Date(now.getTime() + 3600000)

  const snapshot: CaptainSnapshotData = {
    tripId: id,
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
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }

  // Cache snapshot in Redis (1hr TTL)
  const redis = getRedis()
  await redis.set(
    `cache:snapshot:${token}`,
    snapshot,
    { ex: 3600 }
  ).catch(() => null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const snapshotUrl = `${appUrl}/snapshot/${token}`

  return NextResponse.json({
    data: {
      token,
      snapshotUrl,
      expiresAt: expires.toISOString(),
    },
  })
}
