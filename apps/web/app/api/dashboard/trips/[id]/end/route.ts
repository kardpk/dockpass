import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { endBuoyPolicy } from '@/lib/buoy/client'
import { auditLog } from '@/lib/security/audit'
import { rateLimit } from '@/lib/security/rate-limit'

/**
 * POST /api/dashboard/trips/[id]/end
 *
 * Operator-authenticated end-trip endpoint.
 * Uses Supabase auth via cookie session — no snapshot token required.
 * This is the correct path for the operator dashboard "End Trip" button.
 *
 * NOTE: Does NOT use requireOperator() because that function uses React.cache()
 * and calls redirect() on auth failure, which throws NEXT_REDIRECT in Route
 * Handlers and causes silent failures. Instead we read auth directly from the
 * Supabase session cookie, matching the pattern used by all other guards.
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

  // Authenticate via cookie session — read auth user directly
  const supabaseCookie = await createClient()
  const { data: { user }, error: authError } = await supabaseCookie.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Service client for privileged writes
  const supabase = createServiceClient()

  // Verify the user has an operator record
  const { data: operator } = await supabase
    .from('operators')
    .select('id, is_active')
    .eq('id', user.id)
    .single()

  if (!operator || !operator.is_active) {
    return NextResponse.json({ error: 'Operator not found' }, { status: 403 })
  }

  // Fetch trip + verify operator ownership
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select(`
      id, slug, status, started_at, duration_hours,
      max_guests, operator_id, buoy_policy_id,
      boats ( boat_name )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .single()

  if (tripErr || !trip) {
    console.error('[dashboard/end-trip] Trip lookup failed', {
      tripId: id,
      operatorId: operator.id,
      error: tripErr?.message,
    })
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Idempotent — already completed
  if (trip.status === 'completed') {
    return NextResponse.json({ data: { alreadyEnded: true } })
  }

  if (trip.status !== 'active') {
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
  const { error: updateErr } = await supabase
    .from('trips')
    .update({ status: 'completed', ended_at: endedAt })
    .eq('id', id)
    .eq('operator_id', operator.id)
    .eq('status', 'active') // optimistic concurrency

  if (updateErr) {
    console.error('[dashboard/end-trip] UPDATE failed:', updateErr)
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
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'trip',
    entityId: id,
    changes: {
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
    },
  })

  // Operator notification
  void supabase.from('operator_notifications').insert({
    operator_id: operator.id,
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
