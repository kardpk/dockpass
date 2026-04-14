import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { getRedis } from '@/lib/redis/upstash'
import type { CrewRole } from '@/types'

// ── Validation Schema ───────────────────────────────────────
const assignCrewSchema = z.object({
  captainId: z.string().uuid(),
  role: z.enum(['captain', 'first_mate', 'crew', 'deckhand'] as const),
})

const removeCrewSchema = z.object({
  captainId: z.string().uuid(),
})


// ═══════════════════════════════════════════════════════════════
// POST /api/dashboard/trips/[id]/assign-crew
// Assign a captain/crew member to a trip
// ═══════════════════════════════════════════════════════════════
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params

  const limited = await rateLimit(req, {
    max: 20, window: 3600, key: `trips:assign:${tripId}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = assignCrewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { captainId, role } = parsed.data

  // ── Verify trip belongs to operator and is upcoming ──
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id, status, operator_id')
    .eq('id', tripId)
    .eq('operator_id', user.id)
    .single()

  if (tripErr || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  if (trip.status !== 'upcoming') {
    return NextResponse.json(
      { error: `Cannot assign crew to a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  // ── Verify captain belongs to same operator ──
  const { data: captain, error: captainErr } = await supabase
    .from('captains')
    .select('id, full_name, is_active')
    .eq('id', captainId)
    .eq('operator_id', user.id)
    .single()

  if (captainErr || !captain) {
    return NextResponse.json({ error: 'Captain not found in your roster' }, { status: 404 })
  }

  if (!captain.is_active) {
    return NextResponse.json({ error: 'Captain is inactive' }, { status: 409 })
  }

  // ── If assigning role=captain, remove existing captain assignment ──
  if (role === 'captain') {
    await supabase
      .from('trip_assignments')
      .delete()
      .eq('trip_id', tripId)
      .eq('role', 'captain')
  }

  // ── Create assignment (upsert on unique(trip_id, captain_id)) ──
  const { data: assignment, error: assignErr } = await supabase
    .from('trip_assignments')
    .upsert(
      {
        trip_id: tripId,
        captain_id: captainId,
        operator_id: user.id,
        role,
        assigned_by: user.email ?? user.id,
      },
      { onConflict: 'trip_id,captain_id' }
    )
    .select('id, trip_id, captain_id, role, assigned_by, assigned_at')
    .single()

  if (assignErr) {
    console.error('[assign-crew]', assignErr.message)
    return NextResponse.json({ error: 'Failed to assign crew' }, { status: 500 })
  }

  // ── Invalidate snapshot cache ──
  // Bump captain_token_version so any cached snapshot
  // refreshes with the new captain info
  const { error: rpcErr } = await supabase.rpc('increment_captain_token_version', { trip_id_input: tripId })
  if (rpcErr) {
    // If RPC doesn't exist yet, manual increment
    await supabase
      .from('trips')
      .update({ captain_token_version: ((trip as Record<string, unknown>).captain_token_version as number ?? 1) + 1 })
      .eq('id', tripId)
  }

  // Purge Redis cache
  const redis = getRedis()
  const pattern = `cache:snapshot:*`
  // Note: In production, use a more targeted key purge.
  // For now, delete known caches for this trip
  await redis.del(`cache:snapshot:trip:${tripId}`).catch(() => null)

  // ── Audit log ──
  await auditLog({
    action: 'crew_assigned',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'trip',
    entityId: tripId,
    changes: {
      captainId,
      captainName: captain.full_name,
      role: role as CrewRole,
    },
  })

  return NextResponse.json({
    data: {
      ...assignment,
      captainName: captain.full_name,
    },
  }, { status: 201 })
}


// ═══════════════════════════════════════════════════════════════
// DELETE /api/dashboard/trips/[id]/assign-crew
// Remove a crew assignment from a trip
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = removeCrewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { captainId } = parsed.data

  // Verify trip ownership
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status')
    .eq('id', tripId)
    .eq('operator_id', user.id)
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  if (trip.status !== 'upcoming') {
    return NextResponse.json(
      { error: `Cannot modify crew for a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('trip_assignments')
    .delete()
    .eq('trip_id', tripId)
    .eq('captain_id', captainId)
    .eq('operator_id', user.id)

  if (error) {
    console.error('[assign-crew:delete]', error.message)
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }

  await auditLog({
    action: 'crew_removed',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'trip',
    entityId: tripId,
    changes: { captainId, removed: true },
  })

  return NextResponse.json({ data: { tripId, captainId, removed: true } })
}
