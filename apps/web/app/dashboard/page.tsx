import { requireOperator } from '@/lib/security/auth'
import { getDashboardHomeData } from '@/lib/dashboard/getDashboardData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { TodayTripCard } from '@/components/dashboard/TodayTripCard'
import { TodayWeatherBar } from '@/components/dashboard/TodayWeatherBar'
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow'
import { UpcomingTripsList } from '@/components/dashboard/UpcomingTripsList'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { WeatherData } from '@/lib/trip/getWeatherData'

export const metadata: Metadata = { title: 'Dashboard — BoatCheckin' }

export default async function DashboardPage() {
  const { operator } = await requireOperator()
  const data = await getDashboardHomeData(operator.id)

  // No boats yet — show setup prompt
  if (!data.hasBoats) {
    return <EmptyDashboard operatorName={
      operator.full_name?.split(' ')[0] ?? 'there'
    } />
  }

  // Fetch weather for today's trips (parallel)
  const weatherMap = new Map<string, WeatherData>()
  await Promise.all(
    data.todaysTrips.map(async (trip) => {
      if (trip.boat.lat && trip.boat.lng) {
        const w = await getWeatherData(trip.boat.lat, trip.boat.lng, trip.tripDate)
        if (w) weatherMap.set(trip.id, w)
      }
    })
  )

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5 space-y-4">

      {/* Greeting */}
      <DashboardGreeting
        operatorName={operator.full_name?.split(' ')[0] ?? ''}
        todayTripCount={data.todaysTrips.length}
      />

      {/* Today's charter(s) */}
      {data.todaysTrips.map(trip => {
        const tripWeather = weatherMap.get(trip.id)
        return (
          <div key={trip.id} className="space-y-3">
            {tripWeather && (
              <TodayWeatherBar
                weather={tripWeather}
                boatName={trip.boat.boatName}
                tripId={trip.id}
              />
            )}
            <TodayTripCard trip={trip} />
          </div>
        )
      })}

      {/* Stats row */}
      <DashboardStatsRow stats={data.stats} />

      {/* Upcoming trips (next 7 days) */}
      {data.upcomingTrips.length > 0 && (
        <UpcomingTripsList trips={data.upcomingTrips} />
      )}

      {/* No trips at all */}
      {!data.hasTrips && (
        <div className="
          text-center py-10 px-4
          border border-dashed border-[#D0E2F3]
          rounded-[16px]
        ">
          <p className="text-[15px] text-[#6B7C93] mb-4">
            No trips created yet
          </p>
          <Link
            href="/dashboard/trips/new"
            className="
              inline-flex h-[52px] px-6 rounded-[12px]
              bg-[#0C447C] text-white font-semibold text-[15px]
              items-center hover:bg-[#093a6b] transition-colors
            "
          >
            Create your first trip →
          </Link>
        </div>
      )}
    </div>
  )
}
