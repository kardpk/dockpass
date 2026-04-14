'use server'

import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { requireOperator } from '@/lib/security/auth'
import { auditLog } from '@/lib/security/audit'
import { generateTripSlug, generateTripCode } from '@/lib/security/tokens'
import { createTripSchema, sanitiseText } from '@/lib/security/sanitise'
import { invalidateTripCache } from '@/lib/redis/cache'
import { getRedis } from '@/lib/redis/upstash'
import type {
  TripCreatedResult,
  BookingCreatedResult,
  SplitBookingEntry,
} from '@/types'
import type { CreateTripInput } from '@/lib/security/sanitise'

// ─── Action result type ───────────────────────────────────────────────────────

type ActionResult =
  | { success: true; data: TripCreatedResult }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── createTrip ───────────────────────────────────────────────────────────────

export async function createTrip(
  raw: CreateTripInput & { splitBookings?: SplitBookingEntry[] },
): Promise<ActionResult> {

  // 1. Require operator auth
  const { operator } = await requireOperator()

  // 2. Validate schema
  const parsed = createTripSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please check the form for errors',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // 3. Verify boat belongs to this operator and is active
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('id, boat_name, max_capacity, charter_type, marina_name, is_active, operator_id')
    .eq('id', data.boatId)
    .eq('operator_id', operator.id)
    .eq('is_active', true)
    .single()

  if (boatError || !boat) {
    return { success: false, error: 'Boat not found or not active' }
  }

  // 4. Validate maxGuests against boat capacity
  if (data.maxGuests > boat.max_capacity) {
    return {
      success: false,
      error: `Maximum guests cannot exceed boat capacity of ${boat.max_capacity}`,
      fieldErrors: {
        maxGuests: [`Maximum is ${boat.max_capacity} for this boat`],
      },
    }
  }

  // 5. Duplicate prevention (same boat + date + time, non-cancelled)
  const { data: duplicate } = await supabase
    .from('trips')
    .select('id')
    .eq('boat_id', data.boatId)
    .eq('trip_date', data.tripDate)
    .eq('departure_time', data.departureTime)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (duplicate) {
    return {
      success: false,
      error: 'A trip already exists for this boat at this date and time',
    }
  }

  // 6. Generate secure slug + trip code
  const slug = generateTripSlug()
  const tripCode = data.tripCode ?? generateTripCode()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // 7. Insert trip record
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      operator_id: operator.id,
      boat_id: data.boatId,
      slug,
      trip_code: tripCode,
      trip_date: data.tripDate,
      departure_time: data.departureTime,
      duration_hours: data.durationHours,
      max_guests: data.maxGuests,
      charter_type: data.charterType,
      requires_approval: data.requiresApproval,
      special_notes: data.specialNotes ? sanitiseText(data.specialNotes) : null,
      status: 'upcoming',
      trip_purpose: data.tripPurpose ?? 'commercial',
      force_full_compliance: data.forceFullCompliance ?? false,
      fuel_share_disclaimer_accepted: data.fuelShareDisclaimerAccepted ?? false,
    })
    .select('id, slug, trip_code')
    .single()

  if (tripError || !trip) {
    console.error('[createTrip] insert error:', tripError?.code)
    return { success: false, error: 'Failed to create trip. Please try again.' }
  }

  const tripLink = `${appUrl}/trip/${trip.slug}`

  // 8. Audit log (non-blocking)
  auditLog({
    action: 'trip_created',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'trip',
    entityId: trip.id,
    changes: {
      boatId: data.boatId,
      boatName: boat.boat_name,
      tripDate: data.tripDate,
      departureTime: data.departureTime,
      maxGuests: data.maxGuests,
      bookingType: data.bookingType,
    },
  })

  // 9. Warm Redis so the guest page resolves immediately without 404 flicker
  const redis = getRedis()
  await redis
    .set(`cache:trip:exists:${trip.slug}`, '1', { ex: 300 })
    .catch(() => null)

  // 10. Private booking path
  if (data.bookingType === 'private') {
    const bookingSlug = generateTripSlug()
    const bookingCode = generateTripCode()

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        trip_id: trip.id,
        operator_id: operator.id,
        booking_ref: `PRIVATE-${Date.now()}`,
        organiser_name: operator.full_name ?? 'Organiser',
        max_guests: data.maxGuests,
        booking_link: bookingSlug,
        booking_code: bookingCode,
      })

    if (bookingError) {
      console.error('[createTrip] booking insert:', bookingError.code)
    }

    const whatsappMessage = buildWhatsAppMessage({
      tripDate: data.tripDate,
      departureTime: data.departureTime,
      boatName: boat.boat_name,
      marinaName: boat.marina_name,
      tripLink,
      tripCode,
    })

    return {
      success: true,
      data: {
        tripId: trip.id,
        tripSlug: trip.slug,
        tripCode: trip.trip_code,
        tripLink,
        whatsappMessage,
        bookings: [],
      },
    }
  }

  // 11. Split booking path
  const bookingResults: BookingCreatedResult[] = []

  for (const entry of raw.splitBookings ?? []) {
    const bookingSlug = generateTripSlug()
    const bookingCode = generateTripCode()
    const bookingLink = `${appUrl}/trip/${trip.slug}?booking=${bookingSlug}`

    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        trip_id: trip.id,
        operator_id: operator.id,
        booking_ref: `SPLIT-${Date.now()}-${bookingResults.length}`,
        organiser_name: sanitiseText(entry.organiserName),
        organiser_email: entry.organiserEmail || null,
        max_guests: entry.maxGuests,
        booking_link: bookingSlug,
        booking_code: bookingCode,
        notes: entry.notes ? sanitiseText(entry.notes) : null,
      })
      .select('id')
      .single()

    if (booking) {
      bookingResults.push({
        bookingId: booking.id,
        bookingLink,
        bookingCode,
        organiserName: entry.organiserName,
        maxGuests: entry.maxGuests,
        whatsappMessage: buildWhatsAppMessage({
          tripDate: data.tripDate,
          departureTime: data.departureTime,
          boatName: boat.boat_name,
          marinaName: boat.marina_name,
          tripLink: bookingLink,
          tripCode: bookingCode,
          organiserName: entry.organiserName,
        }),
      })
    }
  }

  return {
    success: true,
    data: {
      tripId: trip.id,
      tripSlug: trip.slug,
      tripCode: trip.trip_code,
      tripLink,
      whatsappMessage: buildWhatsAppMessage({
        tripDate: data.tripDate,
        departureTime: data.departureTime,
        boatName: boat.boat_name,
        marinaName: boat.marina_name,
        tripLink,
        tripCode,
      }),
      bookings: bookingResults,
    },
  }
}

// ─── cancelTrip ───────────────────────────────────────────────────────────────

export async function cancelTrip(tripId: string): Promise<ActionResult> {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('id, slug, status')
    .eq('id', tripId)
    .eq('operator_id', operator.id)
    .single()

  if (!trip) {
    return { success: false, error: 'Trip not found' }
  }

  if (trip.status !== 'upcoming') {
    return { success: false, error: 'Only upcoming trips can be cancelled' }
  }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', tripId)
    .eq('operator_id', operator.id)

  if (error) {
    return { success: false, error: 'Failed to cancel trip' }
  }

  await invalidateTripCache(trip.slug)

  auditLog({
    action: 'trip_cancelled',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'trip',
    entityId: tripId,
  })

  return { success: true, data: null as unknown as TripCreatedResult }
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────

function buildWhatsAppMessage(params: {
  tripDate: string
  departureTime: string
  boatName: string
  marinaName: string
  tripLink: string
  tripCode: string
  organiserName?: string
}): string {
  const date = new Date(params.tripDate + 'T00:00:00')
  const dayName = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const time = params.departureTime.slice(0, 5)
  const greeting = params.organiserName
    ? `Hi ${params.organiserName.split(' ')[0]}!`
    : 'Hi!'

  return [
    `${greeting} 🛥️`,
    ``,
    `Everything for our ${dayName} at ${time} aboard ${params.boatName} is here:`,
    ``,
    `👉 ${params.tripLink}`,
    ``,
    `Your check-in code is: *${params.tripCode}*`,
    ``,
    `Sign your waiver, check the weather, and order any add-ons before you arrive.`,
    `See you at ${params.marinaName}!`,
  ].join('\n')
}
