import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { generateSnapshotToken } from '@/lib/security/snapshot'
import { calculateSnapshotExpiry } from '@/lib/security/tokens'
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
      max_guests, status, charter_type, trip_purpose, force_full_compliance,
      safety_briefing_confirmed_at, safety_briefing_confirmed_by, safety_briefing_type,
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

  const expires = calculateSnapshotExpiry((raw as Record<string, unknown>).trip_date as string, (raw as Record<string, unknown>).departure_time as string, 3)
  const token = generateSnapshotToken(id, expires)

  const now = new Date()

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
    .eq('trip_id', id)
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
    tripId: id,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    maxGuests: trip.maxGuests,
    requiredSafetyCards: (() => {
      const cards = (trip.boat.safetyCards ?? []) as { compliance_target?: string; max_length_ft?: number; min_length_ft?: number }[]
      const charterType = trip.charterType ?? 'captained'
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
    charterType: trip.charterType ?? 'captained',
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
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    captainPhotoUrl: resolvedCaptainPhoto,
    captainLicense: resolvedCaptainLicense,
    captainRole: resolvedCaptainRole,
    crewManifest,
    tripPurpose: ((raw as Record<string, unknown>).trip_purpose as string ?? 'commercial') as import('@/types').TripPurpose,
    forceFullCompliance: (raw as Record<string, unknown>).force_full_compliance as boolean ?? false,
    safetyBriefingConfirmedAt: (raw as Record<string, unknown>).safety_briefing_confirmed_at as string ?? null,
    safetyBriefingConfirmedBy: (raw as Record<string, unknown>).safety_briefing_confirmed_by as string ?? null,
    safetyBriefingType: (raw as Record<string, unknown>).safety_briefing_type as string ?? null,
  }

  // Cache snapshot in Redis with an identical TTL
  const redis = getRedis()
  const redisTtlSeconds = Math.max(1, Math.ceil((expires.getTime() - now.getTime()) / 1000))
  await redis.set(
    `cache:snapshot:${token}`,
    snapshot,
    { ex: redisTtlSeconds }
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
