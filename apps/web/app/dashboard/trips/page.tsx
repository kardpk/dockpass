import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/dashboard/TripCard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trips — BoatCheckin' }

export default async function TripsPage() {
  const { operator } = await requireOperator()
  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, special_notes,
      requires_approval,
      boats ( boat_name, marina_name, slip_number, lat, lng ),
      guests ( id, waiver_signed )
    `)
    .eq('operator_id', operator.id)
    .in('status', ['upcoming', 'active'])
    .is('guests.deleted_at', null)
    .order('trip_date', { ascending: true })
    .order('departure_time', { ascending: true })
    .limit(50)

  const upcomingTrips = trips ?? []

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0D1B2A]">Trips</h1>
          <p className="text-[14px] text-[#6B7C93] mt-0.5">
            {upcomingTrips.length} upcoming
          </p>
        </div>
        <Link
          href="/dashboard/trips/new"
          className="h-[44px] px-5 rounded-[12px] bg-[#0C447C] text-white font-semibold text-[14px] flex items-center gap-2 hover:bg-[#093a6b] transition-colors"
        >
          + New trip
        </Link>
      </div>

      {upcomingTrips.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[48px] mb-4">⚓</div>
          <h2 className="text-[18px] font-semibold text-[#0D1B2A] mb-2">No trips yet</h2>
          <p className="text-[15px] text-[#6B7C93] mb-6">
            Create your first trip and share the link with guests
          </p>
          <Link
            href="/dashboard/trips/new"
            className="inline-flex h-[52px] px-8 rounded-[12px] bg-[#0C447C] text-white font-semibold text-[15px] items-center hover:bg-[#093a6b] transition-colors"
          >
            Create my first trip →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingTrips.map((trip) => {
            const guests = (trip.guests as { id: string; waiver_signed: boolean }[]) ?? []
            return (
              <TripCard
                key={trip.id}
                tripId={trip.id}
                slug={trip.slug}
                tripCode={trip.trip_code}
                tripDate={trip.trip_date}
                departureTime={trip.departure_time}
                durationHours={trip.duration_hours}
                maxGuests={trip.max_guests}
                status={trip.status as 'upcoming' | 'active' | 'completed' | 'cancelled'}
                boatName={(trip.boats as unknown as { boat_name: string } | null)?.boat_name ?? ''}
                marinaName={(trip.boats as unknown as { marina_name: string } | null)?.marina_name ?? ''}
                slipNumber={(trip.boats as unknown as { slip_number: string | null } | null)?.slip_number ?? null}
                guestCount={guests.length}
                waiversSigned={guests.filter((g) => g.waiver_signed).length}
                requiresApproval={trip.requires_approval}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
