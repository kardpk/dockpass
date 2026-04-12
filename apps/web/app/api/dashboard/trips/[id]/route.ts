import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { updateTripSchema } from '@/lib/security/sanitise'
import { invalidateTripCache } from '@/lib/redis/cache'

// ─── GET /api/dashboard/trips/[id] ───────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select(
      `
      *,
      boats (
        id, boat_name, boat_type, max_capacity,
        marina_name, marina_address, slip_number,
        parking_instructions, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_languages,
        what_to_bring, house_rules, waiver_text,
        cancellation_policy, safety_cards
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
    `,
    )
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ data: trip })
}

// ─── PUT /api/dashboard/trips/[id] ───────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('trips')
    .update(parsed.data)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, slug')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Invalidate cache so guest page reflects changes immediately
  await invalidateTripCache(data.slug)

  return NextResponse.json({ data })
}
