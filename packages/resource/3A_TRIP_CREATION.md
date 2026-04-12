# BoatCheckin — Phase 3A Agent Instructions
# Trip Creation: Operator → 30-Second Link
# @3A_TRIP_CREATION

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/02-ARCHITECTURE.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/20-PHASE_AUDIT.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3A — Trip Creation.
An operator selects a boat, sets a date and time,
and receives a shareable link in under 30 seconds.
This is the most-used daily operator action.

Use types from apps/web/types/database.ts
Use cn() from lib/utils.ts
Import 'server-only' in all server files
Use await cookies() everywhere — Next.js 15
Use await params — Next.js 15 dynamic routes

Phase 1 (auth) and Phase 2 (boat wizard) are
complete. Build on top of them. Do not modify
any existing auth or wizard files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — ZOD SCHEMAS (validation layer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to: apps/web/lib/security/sanitise.ts

These schemas enforce all trip and booking data
before any database write. Placed here so they
are shared between Server Actions and API routes.

// ─── Trip creation schema ───────────────────
export const createTripSchema = z.object({
  boatId: z.string().uuid({
    message: 'Please select a boat',
  }),
  tripDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      // Trip date must be today or future
      const selected = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selected >= today
    }, 'Trip date cannot be in the past'),
  departureTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  durationHours: z.number()
    .min(0.5, 'Minimum duration is 30 minutes')
    .max(24, 'Maximum duration is 24 hours'),
  maxGuests: z.number()
    .int()
    .min(1, 'At least 1 guest required')
    .max(500, 'Maximum 500 guests'),
  bookingType: z.enum(['private', 'split']),
  requiresApproval: z.boolean(),
  tripCode: z.string()
    .regex(/^[A-Z0-9]{4}$/, 'Trip code must be 4 uppercase letters/numbers')
    .optional(),
  charterType: z.enum(['captained', 'bareboat', 'both']),
  specialNotes: z.string()
    .max(500, 'Notes max 500 characters')
    .optional(),
})

// ─── Split booking schema ───────────────────
export const createBookingSchema = z.object({
  tripId: z.string().uuid(),
  organisers: z.array(z.object({
    organiserName: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100),
    organiserEmail: z.string().email().optional(),
    maxGuests: z.number().int().min(1).max(500),
    notes: z.string().max(500).optional(),
  }))
    .min(1, 'At least one booking required')
    .max(20, 'Maximum 20 split bookings'),
})

// ─── Trip update schema ─────────────────────
export const updateTripSchema = z.object({
  tripDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  departureTime: z.string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  durationHours: z.number().min(0.5).max(24).optional(),
  maxGuests: z.number().int().min(1).max(500).optional(),
  requiresApproval: z.boolean().optional(),
  specialNotes: z.string().max(500).optional(),
  status: z.enum(['upcoming', 'cancelled']).optional(),
})

export type CreateTripInput = z.infer<typeof createTripSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateTripInput = z.infer<typeof updateTripSchema>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to: apps/web/types/index.ts
(extend existing types, do not replace)

// ─── Trip types ─────────────────────────────
export interface TripFormData {
  boatId: string
  boatName: string          // for display only
  boatCapacity: number      // max from boat profile
  tripDate: string          // YYYY-MM-DD
  departureTime: string     // HH:MM
  durationHours: number
  maxGuests: number
  bookingType: 'private' | 'split'
  requiresApproval: boolean
  tripCode: string          // 4-char, auto or manual
  charterType: 'captained' | 'bareboat' | 'both'
  specialNotes: string
  // split mode only
  splitBookings: SplitBookingEntry[]
}

export interface SplitBookingEntry {
  id: string                // temp client-side ID
  organiserName: string
  organiserEmail: string
  maxGuests: number
  notes: string
}

export interface TripCreatedResult {
  tripId: string
  tripSlug: string
  tripCode: string
  tripLink: string          // full URL
  whatsappMessage: string   // pre-written
  bookings: BookingCreatedResult[]
}

export interface BookingCreatedResult {
  bookingId: string
  bookingLink: string       // full URL
  bookingCode: string       // 4-char
  organiserName: string
  maxGuests: number
  whatsappMessage: string
}

// ─── Trip list item ─────────────────────────
export interface TripListItem {
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  charterType: CharterType
  specialNotes: string | null
  guestCount: number        // live count
  waiversSigned: number
  boat: {
    id: string
    boatName: string
    boatType: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    lat: number | null
    lng: number | null
  }
}

// ─── Duration options ────────────────────────
export const DURATION_OPTIONS = [
  { value: 2,   label: '2 hours' },
  { value: 3,   label: '3 hours' },
  { value: 4,   label: '4 hours' },
  { value: 5,   label: '5 hours' },
  { value: 6,   label: '6 hours' },
  { value: 8,   label: '8 hours' },
  { value: 10,  label: '10 hours' },
  { value: 12,  label: 'Full day (12 hrs)' },
  { value: 0,   label: 'Custom duration' },
] as const

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — SERVER ACTION (createTrip)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/trips/new/actions.ts
import 'server-only'
'use server'

This is the single source of truth for trip
creation. Called directly from the form component.
Handles private AND split booking in one action.

import 'server-only'
'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireOperator } from '@/lib/security/auth'
import { auditLog } from '@/lib/security/audit'
import { generateTripSlug, generateTripCode } from '@/lib/security/tokens'
import { createTripSchema, sanitiseText } from '@/lib/security/sanitise'
import { invalidateTripCache } from '@/lib/redis/cache'
import { getRedis } from '@/lib/redis/upstash'
import type {
  CreateTripInput,
  TripCreatedResult,
  BookingCreatedResult,
} from '@/types'

// ─── Action result type ──────────────────────
type ActionResult =
  | { success: true; data: TripCreatedResult }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── createTrip ─────────────────────────────
export async function createTrip(
  raw: CreateTripInput
): Promise<ActionResult> {

  // 1. Require operator auth (throws redirect if not)
  const { operator } = await requireOperator()

  // 2. Validate schema
  const parsed = createTripSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please check the form for errors',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // 3. Verify boat belongs to this operator
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('id, boat_name, max_capacity, charter_type, marina_name, is_active, operator_id')
    .eq('id', data.boatId)
    .eq('operator_id', operator.id)   // RLS + explicit check
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

  // 5. Check for duplicate trip (same boat, date, time)
  // Prevents accidental double-creation
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

  // 6. Generate secure slug and trip code
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
      special_notes: data.specialNotes
        ? sanitiseText(data.specialNotes)
        : null,
      status: 'upcoming',
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

  // 9. Cache the new trip slug in Redis
  // Prevents 404 flicker if guest opens link immediately
  const redis = getRedis()
  await redis.set(
    `cache:trip:exists:${trip.slug}`,
    '1',
    { ex: 300 }
  ).catch(() => null) // non-blocking

  // 10. Handle private booking
  if (data.bookingType === 'private') {
    const bookingSlug = generateTripSlug()
    const bookingCode = generateTripCode()

    const { data: booking, error: bookingError } = await supabase
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
      .select('id, booking_link, booking_code')
      .single()

    if (bookingError || !booking) {
      // Trip created but booking failed — still return trip
      console.error('[createTrip] booking insert:', bookingError?.code)
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

  // 11. Handle split bookings
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
        organiser_email: entry.organiserEmail ?? null,
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

// ─── WhatsApp message builder ───────────────
// Produces natural, non-corporate language
// guests actually want to receive
function buildWhatsAppMessage(params: {
  tripDate: string
  departureTime: string
  boatName: string
  marinaName: string
  tripLink: string
  tripCode: string
  organiserName?: string
}): string {
  const date = new Date(params.tripDate)
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

// ─── cancelTrip ─────────────────────────────
export async function cancelTrip(
  tripId: string
): Promise<ActionResult> {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Verify ownership before any mutation
  const { data: trip } = await supabase
    .from('trips')
    .select('id, slug, status, trip_date, boats(boat_name)')
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
    .eq('operator_id', operator.id) // belt + suspenders

  if (error) {
    return { success: false, error: 'Failed to cancel trip' }
  }

  // Invalidate cache
  await invalidateTripCache(trip.slug)

  auditLog({
    action: 'trip_cancelled',
    operatorId: operator.id,
    entityType: 'trip',
    entityId: tripId,
  })

  return { success: true, data: null as any }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These routes handle external access and the
trips list endpoint used by the dashboard.
Internal mutations use Server Actions (Part 3).

────────────────────────────────────────────
4A. GET /api/dashboard/trips
    Operator's trip list with live guest counts
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/trips/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import type { TripListItem } from '@/types'

export async function GET(req: NextRequest) {
  // 1. Auth
  const { operator } = await requireOperator()

  // 2. Rate limit: 60 requests/min
  const limited = await rateLimit(req, {
    max: 60,
    window: 60,
    key: `trips:list:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // 3. Parse query params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'upcoming'
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = createServiceClient()

  // 4. Fetch trips with boat data joined
  // Guest counts come from a separate aggregation
  const { data: trips, error, count } = await supabase
    .from('trips')
    .select(`
      id,
      slug,
      trip_code,
      trip_date,
      departure_time,
      duration_hours,
      max_guests,
      status,
      charter_type,
      special_notes,
      requires_approval,
      created_at,
      boats (
        id,
        boat_name,
        boat_type,
        marina_name,
        slip_number,
        captain_name,
        lat,
        lng
      )
    `, { count: 'exact' })
    .eq('operator_id', operator.id)
    .eq('status', status)
    .order('trip_date', { ascending: status === 'upcoming' })
    .order('departure_time', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[trips:list]', error.code)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }

  // 5. Get guest counts for all returned trips in one query
  const tripIds = (trips ?? []).map(t => t.id)
  const guestCounts = await getGuestCountsForTrips(tripIds, supabase)

  // 6. Shape response
  const shaped: TripListItem[] = (trips ?? []).map(trip => ({
    id: trip.id,
    slug: trip.slug,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
    durationHours: trip.duration_hours,
    maxGuests: trip.max_guests,
    status: trip.status as any,
    charterType: trip.charter_type as any,
    specialNotes: trip.special_notes,
    guestCount: guestCounts[trip.id]?.total ?? 0,
    waiversSigned: guestCounts[trip.id]?.signed ?? 0,
    boat: {
      id: (trip.boats as any)?.id,
      boatName: (trip.boats as any)?.boat_name,
      boatType: (trip.boats as any)?.boat_type,
      marinaName: (trip.boats as any)?.marina_name,
      slipNumber: (trip.boats as any)?.slip_number ?? null,
      captainName: (trip.boats as any)?.captain_name ?? null,
      lat: (trip.boats as any)?.lat ?? null,
      lng: (trip.boats as any)?.lng ?? null,
    },
  }))

  return NextResponse.json({
    data: shaped,
    meta: {
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + limit < (count ?? 0),
    },
  })
}

// ─── Helper: guest counts in one query ──────
async function getGuestCountsForTrips(
  tripIds: string[],
  supabase: ReturnType<typeof createServiceClient>
): Promise<Record<string, { total: number; signed: number }>> {
  if (tripIds.length === 0) return {}

  const { data } = await supabase
    .from('guests')
    .select('trip_id, waiver_signed')
    .in('trip_id', tripIds)
    .is('deleted_at', null)

  const counts: Record<string, { total: number; signed: number }> = {}
  for (const guest of data ?? []) {
    if (!counts[guest.trip_id]) {
      counts[guest.trip_id] = { total: 0, signed: 0 }
    }
    counts[guest.trip_id].total++
    if (guest.waiver_signed) counts[guest.trip_id].signed++
  }
  return counts
}

────────────────────────────────────────────
4B. GET /api/dashboard/trips/[id]
    Single trip detail for operator
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/trips/[id]/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      boats (
        id, boat_name, boat_type, max_capacity,
        marina_name, marina_address, slip_number,
        parking_instructions, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_languages,
        what_to_bring, house_rules, waiver_text,
        cancellation_policy, safety_points
      ),
      guests (
        id, full_name, emergency_contact_name,
        emergency_contact_phone, dietary_requirements,
        language_preference, waiver_signed, waiver_signed_at,
        approval_status, checked_in_at, created_at,
        guest_addon_orders (
          id, quantity, unit_price_cents, total_cents, status,
          addons ( name, emoji )
        )
      ),
      bookings (
        id, organiser_name, organiser_email,
        max_guests, booking_link, booking_code, notes
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ data: trip })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = updateTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('trips')
    .update(parsed.data)
    .eq('id', id)
    .eq('operator_id', operator.id) // enforce ownership
    .select('id, slug')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Invalidate cache so guest page reflects changes
  await invalidateTripCache(data.slug)

  return NextResponse.json({ data })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — TRIP CREATION PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. Page wrapper (Server Component)
────────────────────────────────────────────

Create: apps/web/app/dashboard/trips/new/page.tsx

import { Suspense } from 'react'
import { requireOperator } from '@/lib/security/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { TripCreateForm } from './TripCreateForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create trip — BoatCheckin',
}

// Fetch operator's boats server-side
// Passed to form so no client-side fetch needed
async function getOperatorBoats(operatorId: string) {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('boats')
    .select('id, boat_name, boat_type, max_capacity, charter_type, marina_name, slip_number')
    .eq('operator_id', operatorId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data ?? []
}

export default async function CreateTripPage() {
  const { operator } = await requireOperator()
  const boats = await getOperatorBoats(operator.id)

  if (boats.length === 0) {
    // Guard: no boats yet — redirect to setup
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="text-4xl">⚓</div>
        <h2 className="text-[18px] font-semibold text-[#0D1B2A]">
          Set up a boat first
        </h2>
        <p className="text-[15px] text-[#6B7C93] text-center max-w-xs">
          You need at least one boat profile before creating a trip.
        </p>
        <a
          href="/dashboard/boats/new"
          className="
            h-[52px] px-6 rounded-[12px]
            bg-[#0C447C] text-white font-semibold text-[15px]
            flex items-center justify-center
            hover:bg-[#093a6b] transition-colors
          "
        >
          Set up my boat →
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0D1B2A]">
          Create a trip
        </h1>
        <p className="text-[15px] text-[#6B7C93] mt-1">
          Share one link with all your guests
        </p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <AnchorLoader size="md" color="navy" />
        </div>
      }>
        <TripCreateForm boats={boats} operatorName={operator.full_name ?? ''} />
      </Suspense>
    </div>
  )
}

────────────────────────────────────────────
5B. TripCreateForm (Client Component)
────────────────────────────────────────────

Create: apps/web/app/dashboard/trips/new/TripCreateForm.tsx
'use client'

This is the primary operator-facing form.
Design principle: feels like 30 seconds.
Every field has a sensible default.
One submit → one result screen.

'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateTripCode } from '@/lib/security/tokens-client'
import { createTrip } from './actions'
import { TripSuccessCard } from './TripSuccessCard'
import { SplitBookingEditor } from './SplitBookingEditor'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { TripFormData, TripCreatedResult, SplitBookingEntry } from '@/types'
import { DURATION_OPTIONS } from '@/types'

interface Boat {
  id: string
  boat_name: string
  boat_type: string
  max_capacity: number
  charter_type: string
  marina_name: string
  slip_number: string | null
}

interface TripCreateFormProps {
  boats: Boat[]
  operatorName: string
}

export function TripCreateForm({ boats, operatorName }: TripCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TripCreatedResult | null>(null)
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [splitBookings, setSplitBookings] = useState<SplitBookingEntry[]>([])

  // ─── Form state ──────────────────────────
  const [form, setForm] = useState<TripFormData>({
    boatId: boats.length === 1 ? boats[0].id : '',
    boatName: boats.length === 1 ? boats[0].boat_name : '',
    boatCapacity: boats.length === 1 ? boats[0].max_capacity : 0,
    tripDate: '',
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: boats.length === 1 ? boats[0].max_capacity : 0,
    bookingType: 'private',
    requiresApproval: false,
    tripCode: generateTripCodeClient(),
    charterType: (boats.length === 1 ? boats[0].charter_type : 'captained') as any,
    specialNotes: '',
    splitBookings: [],
  })

  // Auto-regenerate trip code on boat change
  function handleBoatChange(boatId: string) {
    const boat = boats.find(b => b.id === boatId)
    if (!boat) return
    setForm(prev => ({
      ...prev,
      boatId,
      boatName: boat.boat_name,
      boatCapacity: boat.max_capacity,
      maxGuests: boat.max_capacity,
      charterType: boat.charter_type as any,
    }))
    setFieldErrors({})
  }

  // Min date = today (YYYY-MM-DD for input[type=date])
  const todayStr = new Date().toISOString().split('T')[0]!

  // ─── Submit handler ──────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    startTransition(async () => {
      const res = await createTrip({
        ...form,
        splitBookings:
          form.bookingType === 'split' ? splitBookings : [],
      })

      if (!res.success) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }

      setResult(res.data)
    })
  }

  // Show success screen after creation
  if (result) {
    return (
      <TripSuccessCard
        result={result}
        onCreateAnother={() => {
          setResult(null)
          setForm(prev => ({
            ...prev,
            tripDate: '',
            tripCode: generateTripCodeClient(),
            specialNotes: '',
          }))
        }}
        onViewTrip={() => router.push(`/dashboard/trips/${result.tripId}`)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── BOAT SELECTION ─────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Which boat? <span className="text-[#D63B3B]">*</span>
        </label>
        {boats.length === 1 ? (
          // Only one boat — show as static display, not a select
          <div className="
            flex items-center gap-3 p-4
            border border-[#D0E2F3] rounded-[12px]
            bg-[#F5F8FC]
          ">
            <span className="text-[20px]">🛥️</span>
            <div>
              <p className="text-[15px] font-medium text-[#0D1B2A]">
                {boats[0].boat_name}
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                {boats[0].marina_name} · Up to {boats[0].max_capacity} guests
              </p>
            </div>
          </div>
        ) : (
          <Select
            value={form.boatId}
            onValueChange={handleBoatChange}
          >
            <SelectTrigger className="h-[52px] rounded-[10px] border-[#D0E2F3]">
              <SelectValue placeholder="Select a boat" />
            </SelectTrigger>
            <SelectContent>
              {boats.map(boat => (
                <SelectItem key={boat.id} value={boat.id}>
                  <span className="font-medium">{boat.boat_name}</span>
                  <span className="text-[#6B7C93] ml-2 text-[13px]">
                    · {boat.marina_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {fieldErrors.boatId && (
          <p className="text-[12px] text-[#D63B3B] mt-1">
            {fieldErrors.boatId[0]}
          </p>
        )}
      </div>

      {/* ── DATE + TIME ────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
            Date <span className="text-[#D63B3B]">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={form.tripDate}
            onChange={e => setForm(p => ({ ...p, tripDate: e.target.value }))}
            className={cn(
              'w-full h-[52px] px-3 rounded-[10px] text-[15px]',
              'border bg-white text-[#0D1B2A]',
              'focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent',
              fieldErrors.tripDate
                ? 'border-[#D63B3B]'
                : 'border-[#D0E2F3]'
            )}
            required
          />
          {fieldErrors.tripDate && (
            <p className="text-[12px] text-[#D63B3B] mt-1">
              {fieldErrors.tripDate[0]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
            Departure time <span className="text-[#D63B3B]">*</span>
          </label>
          <input
            type="time"
            step="900" // 15-min intervals
            value={form.departureTime}
            onChange={e => setForm(p => ({ ...p, departureTime: e.target.value }))}
            className="
              w-full h-[52px] px-3 rounded-[10px] text-[15px]
              border border-[#D0E2F3] bg-white text-[#0D1B2A]
              focus:outline-none focus:ring-2 focus:ring-[#0C447C]
              focus:border-transparent
            "
            required
          />
        </div>
      </div>

      {/* ── DURATION ───────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Duration <span className="text-[#D63B3B]">*</span>
        </label>
        {/* Pill selector — faster than dropdown */}
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 0) {
                  setShowCustomDuration(true)
                  setForm(p => ({ ...p, durationHours: 0 }))
                } else {
                  setShowCustomDuration(false)
                  setForm(p => ({ ...p, durationHours: opt.value }))
                }
              }}
              className={cn(
                'px-4 py-2 rounded-[20px] text-[14px] font-medium',
                'border transition-all duration-150',
                'min-h-[44px]', // accessibility
                (opt.value === 0 ? showCustomDuration : form.durationHours === opt.value)
                  ? 'bg-[#0C447C] text-white border-[#0C447C]'
                  : 'bg-white text-[#0D1B2A] border-[#D0E2F3] hover:border-[#0C447C]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showCustomDuration && (
          <div className="mt-3">
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              placeholder="Hours (e.g. 7)"
              value={form.durationHours || ''}
              onChange={e =>
                setForm(p => ({ ...p, durationHours: Number(e.target.value) }))
              }
              className="
                h-[52px] w-36 px-3 rounded-[10px] text-[15px]
                border border-[#0C447C] bg-white text-[#0D1B2A]
                focus:outline-none focus:ring-2 focus:ring-[#0C447C]
              "
              autoFocus
            />
            <span className="text-[13px] text-[#6B7C93] ml-3">hours</span>
          </div>
        )}
        {fieldErrors.durationHours && (
          <p className="text-[12px] text-[#D63B3B] mt-1">
            {fieldErrors.durationHours[0]}
          </p>
        )}
      </div>

      {/* ── MAX GUESTS ─────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Max guests <span className="text-[#D63B3B]">*</span>
        </label>
        <div className="flex items-center gap-4">
          {/* Stepper for small counts (1-12) */}
          <div className="flex items-center gap-0 border border-[#D0E2F3] rounded-[12px] overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setForm(p => ({ ...p, maxGuests: Math.max(1, p.maxGuests - 1) }))
              }
              className="
                w-[52px] h-[52px] text-[20px] font-medium
                text-[#0C447C] hover:bg-[#E8F2FB]
                transition-colors flex items-center justify-center
              "
              aria-label="Decrease guests"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={form.boatCapacity || 500}
              value={form.maxGuests}
              onChange={e =>
                setForm(p => ({
                  ...p,
                  maxGuests: Math.min(
                    Number(e.target.value),
                    p.boatCapacity || 500
                  ),
                }))
              }
              className="
                w-16 h-[52px] text-center text-[18px] font-semibold
                text-[#0D1B2A] border-none outline-none
                bg-transparent
              "
            />
            <button
              type="button"
              onClick={() =>
                setForm(p => ({
                  ...p,
                  maxGuests: Math.min(p.maxGuests + 1, p.boatCapacity || 500),
                }))
              }
              className="
                w-[52px] h-[52px] text-[20px] font-medium
                text-[#0C447C] hover:bg-[#E8F2FB]
                transition-colors flex items-center justify-center
              "
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
          {form.boatCapacity > 0 && (
            <span className="text-[13px] text-[#6B7C93]">
              Max {form.boatCapacity} for this boat
            </span>
          )}
        </div>
        {fieldErrors.maxGuests && (
          <p className="text-[12px] text-[#D63B3B] mt-1">
            {fieldErrors.maxGuests[0]}
          </p>
        )}
      </div>

      {/* ── BOOKING TYPE ───────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Booking type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: 'private' as const,
              icon: '🔒',
              title: 'Private charter',
              body: 'One group, one link',
            },
            {
              value: 'split' as const,
              icon: '👥',
              title: 'Split charter',
              body: 'Multiple separate groups',
            },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(p => ({ ...p, bookingType: opt.value }))}
              className={cn(
                'p-4 rounded-[16px] text-left border transition-all',
                'min-h-[44px]',
                form.bookingType === opt.value
                  ? 'border-2 border-[#0C447C] bg-[#E8F2FB]'
                  : 'border border-[#D0E2F3] bg-white hover:border-[#A8C4E0]'
              )}
            >
              <div className="text-[20px] mb-1">{opt.icon}</div>
              <div className="text-[14px] font-semibold text-[#0D1B2A]">
                {opt.title}
              </div>
              <div className="text-[12px] text-[#6B7C93] mt-0.5">
                {opt.body}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── SPLIT BOOKING ENTRIES ──────────── */}
      {form.bookingType === 'split' && (
        <SplitBookingEditor
          entries={splitBookings}
          onChange={setSplitBookings}
          maxTotalGuests={form.maxGuests}
        />
      )}

      {/* ── APPROVAL MODE ──────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-[#0D1B2A]">
              Manual approval
            </p>
            <p className="text-[13px] text-[#6B7C93] mt-0.5">
              Review each guest before they're confirmed
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.requiresApproval}
            onClick={() =>
              setForm(p => ({ ...p, requiresApproval: !p.requiresApproval }))
            }
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              'focus-visible:ring-2 focus-visible:ring-[#0C447C]',
              form.requiresApproval ? 'bg-[#0C447C]' : 'bg-[#D0E2F3]'
            )}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white',
              'transition-transform shadow-sm',
              form.requiresApproval ? 'translate-x-6' : 'translate-x-0'
            )} />
          </button>
        </div>
      </div>

      {/* ── TRIP CODE ──────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Trip code
          <span className="text-[12px] text-[#6B7C93] font-normal ml-2">
            Guests enter this to check in
          </span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            maxLength={4}
            value={form.tripCode}
            onChange={e =>
              setForm(p => ({
                ...p,
                tripCode: e.target.value.toUpperCase().slice(0, 4),
              }))
            }
            className="
              w-24 h-[52px] text-center text-[22px] font-mono font-bold
              tracking-widest uppercase
              border border-[#D0E2F3] rounded-[10px] text-[#0C447C]
              focus:outline-none focus:ring-2 focus:ring-[#0C447C]
              focus:border-transparent bg-white
            "
            placeholder="SUN4"
          />
          <button
            type="button"
            onClick={() =>
              setForm(p => ({ ...p, tripCode: generateTripCodeClient() }))
            }
            className="
              h-[44px] px-4 rounded-[10px] text-[13px] font-medium
              border border-[#D0E2F3] text-[#6B7C93]
              hover:border-[#0C447C] hover:text-[#0C447C]
              transition-colors
            "
          >
            Regenerate
          </button>
        </div>
        {fieldErrors.tripCode && (
          <p className="text-[12px] text-[#D63B3B] mt-1">
            {fieldErrors.tripCode[0]}
          </p>
        )}
      </div>

      {/* ── SPECIAL NOTES ──────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Special notes
          <span className="text-[12px] font-normal ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.specialNotes}
          onChange={e =>
            setForm(p => ({ ...p, specialNotes: e.target.value }))
          }
          placeholder="e.g. Corporate event, birthday celebration, sunset route"
          className="
            w-full px-4 py-3 rounded-[10px] text-[15px] resize-none
            border border-[#D0E2F3] text-[#0D1B2A] bg-white
            placeholder:text-[#6B7C93]
            focus:outline-none focus:ring-2 focus:ring-[#0C447C]
            focus:border-transparent
          "
        />
        <div className="flex justify-end mt-1">
          <span className={cn(
            'text-[11px]',
            form.specialNotes.length > 450
              ? 'text-[#E8593C]'
              : 'text-[#6B7C93]'
          )}>
            {form.specialNotes.length} / 500
          </span>
        </div>
      </div>

      {/* ── GLOBAL ERROR ───────────────────── */}
      {error && (
        <div className="
          p-4 rounded-[12px] bg-[#FDEAEA]
          border border-[#D63B3B] border-opacity-20
        ">
          <p className="text-[14px] text-[#D63B3B] font-medium">{error}</p>
        </div>
      )}

      {/* ── SUBMIT ─────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || !form.boatId || !form.tripDate}
        className={cn(
          'w-full h-[52px] rounded-[12px] font-semibold text-[16px]',
          'transition-all duration-150',
          'flex items-center justify-center gap-2',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]',
        )}
      >
        {isPending ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          <>Generate trip link →</>
        )}
      </button>
    </form>
  )
}

// ─── Client-side trip code generator ────────
// tokens.ts is server-only so this is a
// lightweight client version for UI purposes
// Server regenerates securely on submission
function generateTripCodeClient(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]!
  ).join('')
}

────────────────────────────────────────────
5C. TripSuccessCard (the payoff screen)
────────────────────────────────────────────

Create: apps/web/app/dashboard/trips/new/TripSuccessCard.tsx
'use client'

This is the most important screen in Phase 3A.
Operator sees it immediately after creating a trip.
Must feel satisfying and be instantly actionable.

'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils'
import type { TripCreatedResult } from '@/types'

interface TripSuccessCardProps {
  result: TripCreatedResult
  onCreateAnother: () => void
  onViewTrip: () => void
}

export function TripSuccessCard({
  result,
  onCreateAnother,
  onViewTrip,
}: TripSuccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const isSplit = result.bookings.length > 0

  async function copyToClipboard(text: string, type: 'link' | 'message') {
    await navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    }
  }

  if (isSplit) {
    return <SplitSuccessCard result={result} onCreateAnother={onCreateAnother} />
  }

  return (
    <div className="space-y-4">
      {/* ── Success header ─────────────────── */}
      <div className="
        p-6 rounded-[20px] bg-[#0C447C]
        text-white text-center
      ">
        <div className="text-[40px] mb-2">⚓</div>
        <h2 className="text-[20px] font-bold mb-1">
          Your trip link is ready!
        </h2>
        <p className="text-[14px] text-white/80">
          Share it with your guests
        </p>

        {/* Trip code — large and prominent */}
        <div className="
          mt-4 inline-flex items-center gap-3
          bg-white/10 rounded-[12px] px-6 py-3
        ">
          <span className="text-[13px] text-white/70">Code</span>
          <span className="
            text-[28px] font-mono font-black tracking-[0.15em]
            text-white
          ">
            {result.tripCode}
          </span>
        </div>
      </div>

      {/* ── Trip link ──────────────────────── */}
      <div className="border border-[#D0E2F3] rounded-[16px] overflow-hidden">
        <div className="p-4">
          <p className="text-[11px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-2">
            Trip link
          </p>
          <p className="text-[14px] text-[#0C447C] break-all font-medium">
            {result.tripLink}
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-[#D0E2F3]">
          <button
            onClick={() => copyToClipboard(result.tripLink, 'link')}
            className={cn(
              'flex items-center justify-center gap-2',
              'h-[52px] text-[14px] font-medium transition-colors',
              'border-r border-[#D0E2F3]',
              copiedLink
                ? 'bg-[#E8F9F4] text-[#1D9E75]'
                : 'text-[#0C447C] hover:bg-[#E8F2FB]'
            )}
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Copied!' : 'Copy link'}
          </button>
          <a
            href={result.tripLink}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-center gap-2
              h-[52px] text-[14px] font-medium
              text-[#6B7C93] hover:bg-[#F5F8FC] transition-colors
            "
          >
            <ExternalLink size={16} />
            Preview
          </a>
        </div>
      </div>

      {/* ── QR Code (for printing/displaying) */}
      <div className="
        border border-[#D0E2F3] rounded-[16px] p-4
        flex flex-col items-center gap-3
      ">
        <p className="text-[12px] text-[#6B7C93] font-medium">
          QR code — print and post at your marina
        </p>
        <div className="bg-white p-3 rounded-[12px] border border-[#D0E2F3]">
          <QRCodeSVG
            value={result.tripLink}
            size={160}
            fgColor="#0C447C"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
      </div>

      {/* ── WhatsApp message ───────────────── */}
      <div className="border border-[#D0E2F3] rounded-[16px] overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-[#1D9E75]" />
            <p className="text-[11px] font-semibold text-[#6B7C93] uppercase tracking-wider">
              Ready-to-send WhatsApp message
            </p>
          </div>
          <pre className="
            text-[14px] text-[#0D1B2A] whitespace-pre-wrap
            font-sans leading-relaxed
          ">
            {result.whatsappMessage}
          </pre>
        </div>
        <button
          onClick={() => copyToClipboard(result.whatsappMessage, 'message')}
          className={cn(
            'w-full h-[52px] border-t border-[#D0E2F3]',
            'flex items-center justify-center gap-2',
            'text-[15px] font-semibold transition-colors',
            copiedMessage
              ? 'bg-[#E8F9F4] text-[#1D9E75]'
              : 'bg-white text-[#0C447C] hover:bg-[#E8F2FB]'
          )}
        >
          {copiedMessage ? <Check size={16} /> : <Copy size={16} />}
          {copiedMessage ? 'Copied to clipboard!' : 'Copy WhatsApp message'}
        </button>
      </div>

      {/* ── Actions ────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onViewTrip}
          className="
            w-full h-[52px] rounded-[12px]
            bg-[#0C447C] text-white font-semibold text-[15px]
            hover:bg-[#093a6b] transition-colors
          "
        >
          View trip & guest list →
        </button>
        <button
          onClick={onCreateAnother}
          className="
            w-full h-[52px] rounded-[12px]
            border border-[#D0E2F3] text-[#0C447C] font-medium text-[15px]
            hover:bg-[#E8F2FB] transition-colors
          "
        >
          Create another trip
        </button>
      </div>
    </div>
  )
}

// ─── Split booking success screen ──────────
function SplitSuccessCard({
  result,
  onCreateAnother,
}: {
  result: TripCreatedResult
  onCreateAnother: () => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyMessage(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-[20px] bg-[#0C447C] text-white text-center">
        <div className="text-[40px] mb-2">⚓</div>
        <h2 className="text-[20px] font-bold">
          {result.bookings.length} booking links ready!
        </h2>
        <p className="text-[13px] text-white/80 mt-1">
          Send each organiser their personal link
        </p>
      </div>

      {result.bookings.map((booking, index) => (
        <div
          key={booking.bookingId}
          className="border border-[#D0E2F3] rounded-[16px] overflow-hidden"
        >
          <div className="p-4 bg-[#F5F8FC] border-b border-[#D0E2F3]">
            <p className="text-[13px] font-semibold text-[#0D1B2A]">
              {booking.organiserName}
            </p>
            <p className="text-[12px] text-[#6B7C93]">
              Max {booking.maxGuests} guests · Code: {booking.bookingCode}
            </p>
          </div>
          <button
            onClick={() => copyMessage(booking.bookingId, booking.whatsappMessage)}
            className={cn(
              'w-full h-[48px]',
              'flex items-center justify-center gap-2',
              'text-[14px] font-medium transition-colors',
              copiedId === booking.bookingId
                ? 'bg-[#E8F9F4] text-[#1D9E75]'
                : 'bg-white text-[#0C447C] hover:bg-[#E8F2FB]'
            )}
          >
            {copiedId === booking.bookingId ? (
              <><Check size={15} /> Copied!</>
            ) : (
              <><Copy size={15} /> Copy message for {booking.organiserName.split(' ')[0]}</>
            )}
          </button>
        </div>
      ))}

      <button
        onClick={onCreateAnother}
        className="
          w-full h-[52px] rounded-[12px]
          border border-[#D0E2F3] text-[#0C447C] font-medium text-[15px]
          hover:bg-[#E8F2FB] transition-colors
        "
      >
        Create another trip
      </button>
    </div>
  )
}

────────────────────────────────────────────
5D. SplitBookingEditor
────────────────────────────────────────────

Create: apps/web/app/dashboard/trips/new/SplitBookingEditor.tsx
'use client'

'use client'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SplitBookingEntry } from '@/types'

interface SplitBookingEditorProps {
  entries: SplitBookingEntry[]
  onChange: (entries: SplitBookingEntry[]) => void
  maxTotalGuests: number
}

export function SplitBookingEditor({
  entries,
  onChange,
  maxTotalGuests,
}: SplitBookingEditorProps) {
  const totalAllocated = entries.reduce((sum, e) => sum + e.maxGuests, 0)
  const remaining = maxTotalGuests - totalAllocated

  function addEntry() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        organiserName: '',
        organiserEmail: '',
        maxGuests: Math.min(remaining, 4),
        notes: '',
      },
    ])
  }

  function removeEntry(id: string) {
    onChange(entries.filter(e => e.id !== id))
  }

  function updateEntry(id: string, field: keyof SplitBookingEntry, value: string | number) {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#6B7C93]">
          Split bookings
        </p>
        {totalAllocated > 0 && (
          <span className={cn(
            'text-[12px] font-medium px-2 py-0.5 rounded-[8px]',
            remaining < 0
              ? 'bg-[#FDEAEA] text-[#D63B3B]'
              : 'bg-[#E8F2FB] text-[#0C447C]'
          )}>
            {totalAllocated} / {maxTotalGuests} allocated
          </span>
        )}
      </div>

      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="p-4 border border-[#D0E2F3] rounded-[12px] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6B7C93]">
              Group {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              className="text-[#6B7C93] hover:text-[#D63B3B] transition-colors p-1"
              aria-label="Remove booking"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Organiser name *"
            value={entry.organiserName}
            onChange={e => updateEntry(entry.id, 'organiserName', e.target.value)}
            className="
              w-full h-[48px] px-3 rounded-[10px] text-[14px]
              border border-[#D0E2F3] bg-white text-[#0D1B2A]
              placeholder:text-[#6B7C93]
              focus:outline-none focus:ring-2 focus:ring-[#0C447C]
            "
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Email (optional)"
              value={entry.organiserEmail}
              onChange={e => updateEntry(entry.id, 'organiserEmail', e.target.value)}
              className="
                h-[48px] px-3 rounded-[10px] text-[14px]
                border border-[#D0E2F3] bg-white text-[#0D1B2A]
                placeholder:text-[#6B7C93]
                focus:outline-none focus:ring-2 focus:ring-[#0C447C]
              "
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={maxTotalGuests}
                value={entry.maxGuests}
                onChange={e =>
                  updateEntry(entry.id, 'maxGuests', Number(e.target.value))
                }
                className="
                  w-20 h-[48px] px-3 rounded-[10px] text-[14px] text-center
                  border border-[#D0E2F3] bg-white text-[#0D1B2A]
                  focus:outline-none focus:ring-2 focus:ring-[#0C447C]
                "
              />
              <span className="text-[13px] text-[#6B7C93]">guests</span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        disabled={remaining <= 0}
        className={cn(
          'w-full h-[48px] rounded-[12px] border',
          'flex items-center justify-center gap-2',
          'text-[14px] font-medium transition-colors',
          remaining <= 0
            ? 'border-[#D0E2F3] text-[#D0E2F3] cursor-not-allowed'
            : 'border-dashed border-[#A8C4E0] text-[#0C447C] hover:bg-[#E8F2FB]'
        )}
      >
        <Plus size={16} />
        Add group
        {remaining > 0 && (
          <span className="text-[12px] text-[#6B7C93]">
            ({remaining} guests remaining)
          </span>
        )}
      </button>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — TRIPS LIST PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/trips/page.tsx

Server Component. Fetches upcoming trips
server-side. Renders trip cards with live status.

import { requireOperator } from '@/lib/security/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { TripCard } from '@/components/dashboard/TripCard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trips — BoatCheckin' }

export default async function TripsPage() {
  const { operator } = await requireOperator()
  const supabase = await createSupabaseServer()

  // Fetch trips + guest counts
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
          <h1 className="text-[22px] font-semibold text-[#0D1B2A]">
            Trips
          </h1>
          <p className="text-[14px] text-[#6B7C93] mt-0.5">
            {upcomingTrips.length} upcoming
          </p>
        </div>
        <Link
          href="/dashboard/trips/new"
          className="
            h-[44px] px-5 rounded-[12px]
            bg-[#0C447C] text-white font-semibold text-[14px]
            flex items-center gap-2
            hover:bg-[#093a6b] transition-colors
          "
        >
          + New trip
        </Link>
      </div>

      {upcomingTrips.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[48px] mb-4">⚓</div>
          <h2 className="text-[18px] font-semibold text-[#0D1B2A] mb-2">
            No trips yet
          </h2>
          <p className="text-[15px] text-[#6B7C93] mb-6">
            Create your first trip and share the link with guests
          </p>
          <Link
            href="/dashboard/trips/new"
            className="
              inline-flex h-[52px] px-8 rounded-[12px]
              bg-[#0C447C] text-white font-semibold text-[15px]
              items-center hover:bg-[#093a6b] transition-colors
            "
          >
            Create my first trip →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingTrips.map(trip => {
            const guests = (trip.guests as any[]) ?? []
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
                status={trip.status}
                boatName={(trip.boats as any)?.boat_name ?? ''}
                marinaName={(trip.boats as any)?.marina_name ?? ''}
                slipNumber={(trip.boats as any)?.slip_number ?? null}
                guestCount={guests.length}
                waiversSigned={guests.filter((g: any) => g.waiver_signed).length}
                requiresApproval={trip.requires_approval}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — SHARED COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
7A. TripCard (reused across dashboard)
────────────────────────────────────────────

Create: apps/web/components/dashboard/TripCard.tsx
'use client'

'use client'
import Link from 'next/link'
import { formatTripDate, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import { cn } from '@/lib/utils'
import type { TripStatus } from '@/types'

interface TripCardProps {
  tripId: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  boatName: string
  marinaName: string
  slipNumber: string | null
  guestCount: number
  waiversSigned: number
  requiresApproval: boolean
}

export function TripCard({
  tripId, slug, tripCode, tripDate, departureTime,
  durationHours, maxGuests, status, boatName, marinaName,
  slipNumber, guestCount, waiversSigned, requiresApproval,
}: TripCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const tripLink = `${appUrl}/trip/${slug}`
  const guestPercent = (guestCount / maxGuests) * 100

  return (
    <Link
      href={`/dashboard/trips/${tripId}`}
      className="
        block p-5 bg-white border border-[#D0E2F3]
        rounded-[16px] hover:border-[#A8C4E0]
        transition-colors shadow-[0_1px_4px_rgba(12,68,124,0.06)]
      "
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[15px] font-semibold text-[#0D1B2A]">
            {boatName}
          </p>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            {formatTripDate(tripDate)} · {departureTime.slice(0, 5)} ·{' '}
            {formatDuration(durationHours)}
          </p>
        </div>
        <TripStatusBadge status={status} />
      </div>

      {/* Marina */}
      <p className="text-[13px] text-[#6B7C93] mb-3">
        📍 {marinaName}{slipNumber ? ` · Slip ${slipNumber}` : ''}
      </p>

      {/* Guest progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#6B7C93]">
            {guestCount} / {maxGuests} checked in
          </span>
          <span className="text-[12px] text-[#6B7C93]">
            {waiversSigned} waiver{waiversSigned !== 1 ? 's' : ''} signed
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#E8F2FB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(guestPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Trip code */}
      <div className="
        mt-3 flex items-center gap-2
        pt-3 border-t border-[#F5F8FC]
      ">
        <span className="text-[11px] text-[#6B7C93]">Code</span>
        <span className="text-[14px] font-mono font-bold text-[#0C447C]">
          {tripCode}
        </span>
        {requiresApproval && (
          <span className="
            ml-auto text-[11px] px-2 py-0.5 rounded-full
            bg-[#FEF3DC] text-[#E5910A] font-medium
          ">
            Manual approval on
          </span>
        )}
      </div>
    </Link>
  )
}

────────────────────────────────────────────
7B. TripStatusBadge
────────────────────────────────────────────

Create: apps/web/components/ui/TripStatusBadge.tsx

import { cn } from '@/lib/utils'
import type { TripStatus } from '@/types'

const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    className: 'bg-[#E8F2FB] text-[#0C447C]',
  },
  active: {
    label: 'Active ●',
    className: 'bg-[#E8F9F4] text-[#1D9E75]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#F5F8FC] text-[#6B7C93]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[#FDEAEA] text-[#D63B3B]',
  },
} as const

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1',
      'text-[12px] font-semibold rounded-full',
      config.className
    )}>
      {config.label}
    </span>
  )
}

────────────────────────────────────────────
7C. Format utilities
────────────────────────────────────────────

Create: apps/web/lib/utils/format.ts
(pure functions, usable on server and client)

export function formatTripDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${hours * 60}min`
  if (hours === Math.floor(hours)) return `${hours}hr`
  const whole = Math.floor(hours)
  const mins = (hours - whole) * 60
  return `${whole}hr ${mins}min`
}

export function formatTime(timeStr: string): string {
  // '14:30' → '2:30 PM'
  const [hoursStr, minsStr] = timeStr.split(':')
  const hours = Number(hoursStr)
  const mins = minsStr ?? '00'
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${mins} ${ampm}`
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — ROUTING + NAVIGATION WIRING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update the following existing files to wire
Phase 3A into the dashboard navigation.
Do NOT break any existing functionality.

────────────────────────────────────────────
8A. Update BottomNav.tsx
────────────────────────────────────────────

Update: apps/web/app/dashboard/BottomNav.tsx

Change the Anchor/Trips tab href:
  FROM: href="/dashboard/trips" (may not exist yet)
  TO:   href="/dashboard/trips" (now exists)

Active state matching:
  Trips tab is active for:
    /dashboard/trips
    /dashboard/trips/new
    /dashboard/trips/[id]

Add a '+' quick action button floating
above the bottom nav (visible only on /dashboard/trips):
  Position: fixed, bottom 80px, right 20px
  Size: 52px circle, navy bg
  Icon: Plus (lucide, white)
  href: /dashboard/trips/new
  Shadow: 0 4px 16px rgba(12,68,124,0.25)

────────────────────────────────────────────
8B. Update Sidebar.tsx
────────────────────────────────────────────

Update: apps/web/app/dashboard/Sidebar.tsx

Trips nav item active for:
  /dashboard/trips
  /dashboard/trips/new
  /dashboard/trips/[id]

────────────────────────────────────────────
8C. Update dashboard home page
────────────────────────────────────────────

Update: apps/web/app/dashboard/page.tsx

Replace placeholder with a real first-state:

If operator has no trips:
  Show empty state (same as current, correct)

If operator has trips:
  Show today's or next upcoming trip card
  (fetch single latest trip server-side)
  [View all trips →]
  [+ Create new trip →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/trips/
  createTripSchema.test.ts

import { describe, it, expect } from 'vitest'
import { createTripSchema } from '@/lib/security/sanitise'

describe('createTripSchema', () => {

  const valid = {
    boatId: '550e8400-e29b-41d4-a716-446655440000',
    tripDate: new Date(Date.now() + 86400000)
      .toISOString().split('T')[0],
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: 8,
    bookingType: 'private' as const,
    requiresApproval: false,
    charterType: 'captained' as const,
  }

  it('accepts valid trip data', () => {
    expect(createTripSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects past trip dates', () => {
    const result = createTripSchema.safeParse({
      ...valid,
      tripDate: '2020-01-01',
    })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error))
      .toContain('past')
  })

  it('rejects invalid UUID for boatId', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      boatId: 'not-a-uuid',
    }).success).toBe(false)
  })

  it('rejects duration below 0.5', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      durationHours: 0.25,
    }).success).toBe(false)
  })

  it('rejects maxGuests of 0', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      maxGuests: 0,
    }).success).toBe(false)
  })

  it('rejects maxGuests over 500', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      maxGuests: 501,
    }).success).toBe(false)
  })

  it('rejects invalid time format', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      departureTime: '9am',
    }).success).toBe(false)
  })

  it('accepts optional custom trip code', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      tripCode: 'SUN4',
    }).success).toBe(true)
  })

  it('rejects trip code with lowercase', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      tripCode: 'sun4',
    }).success).toBe(false)
  })

  it('rejects notes over 500 chars', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      specialNotes: 'x'.repeat(501),
    }).success).toBe(false)
  })

  it('accepts notes exactly at 500 chars', () => {
    expect(createTripSchema.safeParse({
      ...valid,
      specialNotes: 'x'.repeat(500),
    }).success).toBe(true)
  })
})

Create: apps/web/__tests__/unit/utils/
  format.test.ts

import { describe, it, expect } from 'vitest'
import { formatTripDate, formatDuration, formatTime } from '@/lib/utils/format'

describe('formatDuration', () => {
  it('formats whole hours', () => {
    expect(formatDuration(4)).toBe('4hr')
  })

  it('formats half hour', () => {
    expect(formatDuration(0.5)).toBe('30min')
  })

  it('formats mixed hours and minutes', () => {
    expect(formatDuration(2.5)).toBe('2hr 30min')
  })
})

describe('formatTime', () => {
  it('formats 14:30 as 2:30 PM', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
  })

  it('formats 09:00 as 9:00 AM', () => {
    expect(formatTime('09:00')).toBe('9:00 AM')
  })

  it('formats 12:00 as 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 10 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run all 12 tests before reporting complete.
A test that fails = do not proceed to Phase 3B.

TEST 1 — Unit tests pass:
  npm run test
  All tests in __tests__/unit/trips/ and
  __tests__/unit/utils/ must pass.

TEST 2 — Create private trip end-to-end:
  Login as demo operator (demo@boatcheckin.com)
  Navigate to /dashboard/trips/new
  Select boat (Conrad's Yacht Miami)
  Set date to tomorrow
  Set time to 10:00
  Select duration: 4 hours
  Set max guests: 8
  Leave booking type: Private
  Toggle trip code: leave as auto-generated
  Click "Generate trip link →"
  EXPECTED:
    Success screen appears
    Trip link shown (boatcheckin.com/trip/[slug])
    Trip code displayed large
    WhatsApp message ready to copy
    QR code rendered

TEST 3 — Verify in Supabase:
  trips table: new row with correct values
  slug: 22 chars, URL-safe characters only
  trip_code: 4 uppercase alphanumeric
  bookings table: 1 row for private trip
  audit_log: 'trip_created' entry

TEST 4 — Copy functions work:
  Click "Copy link" → clipboard has trip URL
  Click "Copy WhatsApp message" → clipboard has message
  Both buttons show ✓ confirmation for 2 seconds

TEST 5 — Split booking mode:
  Select booking type: Split
  Add Group 1: "Jiri Dvořáček", 4 guests
  Add Group 2: "Carlos Mendez", 4 guests
  Total: 8/8 allocated
  Submit
  EXPECTED:
    2 booking link cards on success screen
    Each with personalised copy button
    Each generates unique link + code

TEST 6 — Validation errors:
  Submit with no boat selected → error shown
  Submit with past date → "cannot be in the past"
  Submit with maxGuests > boat.max_capacity → error
  All errors show without page refresh

TEST 7 — Duplicate prevention:
  Create same boat + date + time twice
  EXPECTED:
    Second creation rejected
    Error: "trip already exists at this time"

TEST 8 — Trip code regeneration:
  Click "Regenerate" button 5 times
  Each new code is 4 uppercase alphanumeric
  No ambiguous chars (O, 0, I, 1)

TEST 9 — Trips list page:
  Navigate to /dashboard/trips
  New trip appears in list
  Shows correct date, time, boat name
  Progress bar at 0% (no guests yet)
  "0 / 8 checked in" text correct

TEST 10 — Single boat auto-selection:
  If operator has only 1 boat:
  /dashboard/trips/new shows boat as static
  (not a dropdown)
  Max guests pre-filled from boat capacity

TEST 11 — Navigation wiring:
  Click Trips in bottom nav → /dashboard/trips
  Click + in trips list → /dashboard/trips/new
  Click Back from new trip → /dashboard/trips
  TripCard in list → /dashboard/trips/[id]

TEST 12 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  No unused imports
  No 'any' types in new files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 12 tests pass:
  1. List every file created (full paths)
  2. List every file modified (full paths + what changed)
  3. All 12 test results: ✅ pass / ❌ fail
  4. Supabase row counts:
     trips: N rows
     bookings: N rows
     audit_log: N rows
  5. Any deviations from spec + why
  6. Build output (typecheck + build clean)
  7. Total lines added across all files
```
