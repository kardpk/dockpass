import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { endBuoyPolicy } from '@/lib/buoy/client'
import { auditLog } from '@/lib/security/audit'
import { rateLimit } from '@/lib/security/rate-limit'
import { correctTripStatus } from '@/lib/utils/tripStatus'

/**
 * POST /api/dashboard/trips/[id]/end
 *
 * Operator-authenticated end-trip endpoint.
 * Uses cookie session auth — no snapshot token required.
 *
 * Strategy:
 *  1. Read user from cookie session (createClient)
 *  2. Fetch trip by ID alone (no ownership filter in SELECT)
 *  3. Verify trip.operator_id === user.id manually
 *  4. Update trip status
 *
 * This separates "trip not found" from "ownership mismatch" and avoids
 * the SELECT returning empty due to combined filter issues.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Rate limit
  const limited = await rateLimit(req, {
    max: 10, window: 3600,
    key: `dashboard:trip:end:${id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Auth: read user from cookie session
  const supabaseCookie = await createClient()
  const { data: { user }, error: authError } = await supabaseCookie.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Service client — bypasses RLS for all subsequent queries
  const supabase = createServiceClient()

  // Fetch trip by ID only (no owner filter in SELECT to avoid silent null)
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select(`
      id, slug, status, trip_date, started_at, duration_hours,
      max_guests, operator_id, buoy_policy_id,
      boats ( boat_name )
    `)
    .eq('id', id)
    .single()

  if (tripErr || !trip) {
    console.error('[end-trip] trip fetch failed', { id, error: tripErr?.message })
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Ownership check — trip must belong to the authenticated user
  if (trip.operator_id !== user.id) {
    console.error('[end-trip] ownership mismatch', {
      tripId: id,
      tripOperatorId: trip.operator_id,
      userId: user.id,
    })
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Idempotent — already completed
  if (trip.status === 'completed') {
    return NextResponse.json({ data: { alreadyEnded: true } })
  }

  // Apply the same date-correction logic the UI uses (correctTripStatus):
  // A trip whose date is today with DB status 'upcoming' is treated as 'active'.
  // Without this, the End Trip button is visible in the UI but the API rejects it.
  const tripDate = (trip as Record<string, unknown>).trip_date as string | undefined
  const effectiveStatus = tripDate
    ? correctTripStatus(tripDate, trip.status as string)
    : trip.status

  if (effectiveStatus !== 'active') {
    return NextResponse.json(
      { error: `Cannot end a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  const endedAt = new Date().toISOString()

  // Calculate actual duration
  let actualHours = trip.duration_hours as number
  if (trip.started_at) {
    const startMs = new Date(trip.started_at as string).getTime()
    actualHours = (Date.now() - startMs) / 3600000
  }

  // Update trip to completed
  // Note: DB status may be 'upcoming' (if date-corrected to active by UI),
  // so we filter on either 'active' OR 'upcoming' to handle both cases.
  const { error: updateErr } = await supabase
    .from('trips')
    .update({ status: 'completed', ended_at: endedAt })
    .eq('id', id)
    .in('status', ['active', 'upcoming']) // Accept both DB states

  if (updateErr) {
    console.error('[end-trip] UPDATE failed:', updateErr.message)
    return NextResponse.json({ error: 'Failed to end trip' }, { status: 500 })
  }

  // End Buoy policy (non-blocking)
  if (trip.buoy_policy_id) {
    endBuoyPolicy({
      policyId: trip.buoy_policy_id as string,
      tripId: id,
      endedAt,
      actualDurationHours: actualHours,
    }).catch(() => null)
  }

  // Audit log
  auditLog({
    action: 'trip_ended',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.id,
    entityType: 'trip',
    entityId: id,
    changes: {
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
    },
  })

  // Operator notification
  void supabase.from('operator_notifications').insert({
    operator_id: user.id,
    type: 'trip_ended',
    title: 'Trip completed',
    body: `${(trip.boats as { boat_name: string })?.boat_name ?? 'Your boat'} has returned`,
    data: { tripId: id },
  })

  return NextResponse.json({
    data: {
      ended: true,
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
    },
  })
}
