import { notFound } from 'next/navigation'
import { verifyCaptainToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'
import { shapeTripDetail, buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import { CaptainSnapshotView } from '@/components/captain/CaptainSnapshotView'
import type { Metadata } from 'next'
import type { CaptainSnapshotData } from '@/types'

export const metadata: Metadata = {
  title: 'Captain Snapshot — BoatCheckin',
  robots: { index: false },  // Never index captain pages
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Verify token natively (checks TTL and HMAC)
  const result = verifyCaptainToken(token)

  if (!result) {
    return <TokenInvalidPage />
  }

  const tripId = result.tripId
  const supabase = createServiceClient()

  // Fetch full trip for snapshot
  const { data: raw } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, trip_code, status, started_at, charter_type, requires_approval,
      special_notes, captain_token_version, trip_purpose, force_full_compliance,
      safety_briefing_confirmed_at, safety_briefing_confirmed_by, safety_briefing_type,
      boats (
        id, boat_name, boat_type, marina_name, marina_address, slip_number,
        captain_name, lat, lng, waiver_text, safety_cards,
        captain_photo_url
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, date_of_birth, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, checked_in_at, approval_status, created_at,
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
  if (!raw) notFound()

  if ((raw as any).captain_token_version !== result.version) {
    return <TokenInvalidPage />
  }

  const trip = shapeTripDetail(raw as unknown as Record<string, unknown>)
  const boat = (raw as any).boats as any

  // Fetch live weather from Open-Meteo (cached 3hr in Redis)
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(Number(boat.lat), Number(boat.lng), trip.tripDate)
    : null

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
    weather: weather ? {
      label: weather.label,
      temperature: weather.temperature,
      icon: weather.icon,
    } : null,
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
    tripPurpose: (raw as any).trip_purpose ?? 'commercial',
    forceFullCompliance: (raw as any).force_full_compliance ?? false,
    safetyBriefingConfirmedAt: (raw as any).safety_briefing_confirmed_at ?? null,
    safetyBriefingConfirmedBy: (raw as any).safety_briefing_confirmed_by ?? null,
    safetyBriefingType: (raw as any).safety_briefing_type ?? null,
  }

  return (
    <CaptainSnapshotView
      snapshot={snapshot}
      token={token}
      tripStatus={trip.status}
      startedAt={trip.startedAt}
      buoyPolicyId={(raw as any).buoy_policy_id ?? null}
    />
  )
}

function TokenInvalidPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Invalid link
        </h1>
        <p className="text-[15px] text-text-mid">
          This captain link is invalid or has been tampered with.
          Ask the operator for a new link.
        </p>
      </div>
    </div>
  )
}

function TokenExpiredPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-[48px] mb-4">⏰</div>
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Link expired
        </h1>
        <p className="text-[15px] text-text-mid">
          Captain links are time-limited and have expired.
          Ask the operator to share a fresh link.
        </p>
      </div>
    </div>
  )
}
