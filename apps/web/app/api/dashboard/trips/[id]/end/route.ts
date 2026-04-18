import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { endBuoyPolicy } from '@/lib/buoy/client'
import { auditLog } from '@/lib/security/audit'
import { rateLimit } from '@/lib/security/rate-limit'

/**
 * POST /api/dashboard/trips/[id]/end
 *
 * Operator-authenticated end-trip endpoint.
 * Uses requireOperator() (cookie session) — no snapshot token required.
 * This is the correct path for the operator dashboard "End Trip" button.
 *
 * The captain-facing /api/trips/[slug]/end endpoint uses snapshot tokens
 * and is reserved for captains ending trips from their link.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Rate limit: max 10 ends per hour per operator (idempotent-safe)
  const limited = await rateLimit(req, {
    max: 10, window: 3600,
    key: `dashboard:trip:end:${id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Fetch trip — verify operator ownership
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, status, started_at, duration_hours,
      max_guests, operator_id, buoy_policy_id,
      boats ( boat_name )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)  // ownership check
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Idempotent: already completed
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
    .eq('status', 'active')  // optimistic concurrency

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
