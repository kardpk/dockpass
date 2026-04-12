import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'

import { getWeatherData } from '@/lib/trip/getWeatherData'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `post-trip:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time,
      duration_hours, status,
      operators ( company_name ),
      boats (
        boat_name, captain_name, marina_name,
        lat, lng, boatsetter_url, google_review_url,
        boatsetter_review_url
      )
    `)
    .eq('slug', slug)
    .eq('status', 'completed')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found or not completed' },
      { status: 404 }
    )
  }

  const boat = trip.boats as any
  const operator = trip.operators as any

  // Fetch weather for the trip date
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(
        Number(boat.lat), Number(boat.lng), trip.trip_date
      )
    : null

  return NextResponse.json({
    data: {
      tripId: trip.id,
      slug: trip.slug,
      tripDate: trip.trip_date,
      departureTime: trip.departure_time,
      durationHours: trip.duration_hours,
      boatName: boat?.boat_name ?? '',
      captainName: boat?.captain_name ?? null,
      marinaName: boat?.marina_name ?? '',
      operatorCompanyName: operator?.company_name ?? null,
      boatsetterUrl: boat?.boatsetter_url ?? null,
      googleReviewUrl: boat?.google_review_url ?? null,
      boatsetterReviewUrl: boat?.boatsetter_review_url ?? null,
      weather: weather ? {
        icon: weather.icon,
        label: weather.label,
        temperature: weather.temperature,
      } : null,
    },
  })
}
