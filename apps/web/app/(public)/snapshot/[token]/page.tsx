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
      special_notes, buoy_policy_id, captain_token_version,
      boats (
        id, boat_name, boat_type, marina_name, marina_address, slip_number,
        captain_name, lat, lng, waiver_text, safety_cards,
        captain_photo_url
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
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
    weather: weather ? {
      label: weather.label,
      temperature: weather.temperature,
      icon: weather.icon,
    } : null,
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
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-[48px] mb-4">🔒</div>
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Invalid link
        </h1>
        <p className="text-[15px] text-[#6B7C93]">
          This captain link is invalid or has been tampered with.
          Ask the operator for a new link.
        </p>
      </div>
    </div>
  )
}

function TokenExpiredPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-[48px] mb-4">⏰</div>
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Link expired
        </h1>
        <p className="text-[15px] text-[#6B7C93]">
          Captain links expire after 1 hour.
          Ask the operator to share a fresh link.
        </p>
      </div>
    </div>
  )
}
