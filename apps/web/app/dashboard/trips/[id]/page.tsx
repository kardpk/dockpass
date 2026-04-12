import { notFound } from 'next/navigation'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { shapeTripDetail, buildAddonSummary } from '@/lib/dashboard/getDashboardData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { TripDetailHeader } from '@/components/dashboard/TripDetailHeader'
import { GuestManagementTable } from '@/components/dashboard/GuestManagementTable'
import { TripStatusBar } from '@/components/dashboard/TripStatusBar'
import { AddonOrdersSummary } from '@/components/dashboard/AddonOrdersSummary'
import { TripReviewsSummary } from '@/components/dashboard/TripReviewsSummary'
import { TripActionBar } from '@/components/dashboard/TripActionBar'
import { WeatherAlertCard } from '@/components/dashboard/WeatherAlertCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trip detail — BoatCheckin' }

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at, buoy_policy_id,
      bookings ( id, organiser_name, organiser_email,
        max_guests, booking_code, notes ),
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_cards
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
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
    .order('created_at', {
      referencedTable: 'guests',
      ascending: true,
    })
    .single()

  if (error || !raw) notFound()

  const trip = shapeTripDetail(raw as Record<string, unknown>)
  const addonSummary = buildAddonSummary(trip.guests)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Fetch weather for alert card
  const boat = raw.boats as unknown as { lat: number | null; lng: number | null } | null
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(boat.lat, boat.lng, trip.tripDate)
    : null

  const whatsappMsg = [
    `Hi! Everything for your charter is here:`,
    ``,
    `👉 ${appUrl}/trip/${trip.slug}`,
    `Code: *${trip.tripCode}*`,
    ``,
    `Sign your waiver and order any extras before you arrive.`,
  ].join('\n')

  return (
    <div className="max-w-[720px] mx-auto px-4 py-5">
      <TripDetailHeader trip={trip} />

      {/* Weather alert */}
      {weather && (
        <div className="mt-4">
          <WeatherAlertCard
            tripId={trip.id}
            weather={weather}
            guestCount={trip.guests.length}
          />
        </div>
      )}

      <GuestManagementTable
        tripId={trip.id}
        initialGuests={trip.guests}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
      />

      {/* Trip Control — Start/End + compliance banner */}
      <TripStatusBar
        tripId={trip.id}
        tripSlug={trip.slug}
        initialStatus={trip.status}
        initialStartedAt={trip.startedAt}
        initialGuests={trip.guests}
        requiredSafetyCards={trip.boat.safetyCards?.length ?? 0}
      />

      {addonSummary.length > 0 && (
        <AddonOrdersSummary
          summary={addonSummary}
          className="mt-4"
        />
      )}

      {trip.status === 'completed' && (
        <TripReviewsSummary
          tripId={trip.id}
          operatorId={operator.id}
        />
      )}

      {/* Sticky action bar */}
      <TripActionBar
        tripId={trip.id}
        tripSlug={trip.slug}
        status={trip.status}
        whatsappMessage={whatsappMsg}
      />
    </div>
  )
}
