import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { endBuoyPolicy } from '@/lib/buoy/client'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const endSchema = z.object({
  snapshotToken: z.string().min(10),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, {
    max: 5, window: 3600,
    key: `trip:end:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = endSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request' }, { status: 400 }
    )
  }

  // Verify token
  const tokenResult = verifySnapshotToken(parsed.data.snapshotToken)
  if (!tokenResult || tokenResult.expired) {
    return NextResponse.json(
      { error: 'Invalid or expired token' }, { status: 401 }
    )
  }

  const tripId = tokenResult.tripId
  const supabase = createServiceClient()

  // Fetch active trip
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, status, started_at, duration_hours,
      max_guests, operator_id, buoy_policy_id,
      boats ( boat_name )
    `)
    .eq('id', tripId)
    .eq('slug', slug)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  // Idempotent: already completed
  if (trip.status === 'completed') {
    return NextResponse.json({
      data: { alreadyEnded: true }
    })
  }

  if (trip.status !== 'active') {
    return NextResponse.json(
      { error: `Cannot end a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  const endedAt = new Date().toISOString()

  // Calculate actual duration
  let actualHours = trip.duration_hours
  if (trip.started_at) {
    const startMs = new Date(trip.started_at).getTime()
    actualHours = (Date.now() - startMs) / 3600000
  }

  // ── Update trip to completed ─────────────
  const { error: updateErr } = await supabase
    .from('trips')
    .update({
      status: 'completed',
      ended_at: endedAt,
    })
    .eq('id', tripId)
    .eq('status', 'active')

  if (updateErr) {
    return NextResponse.json(
      { error: 'Failed to end trip' }, { status: 500 }
    )
  }

  // ── End Buoy policy (non-blocking) ───────
  if (trip.buoy_policy_id) {
    endBuoyPolicy({
      policyId: trip.buoy_policy_id,
      tripId,
      endedAt,
      actualDurationHours: actualHours,
    }).catch(() => null)
  }

  // ── Queue review requests (2hr delay) ────
  // TODO: Re-enable when BullMQ worker is deployed.
  // Requires: npm install bullmq ioredis + separate worker process.
  console.warn(
    `[end-trip] Review queue disabled. Trip ${tripId} ended. ` +
    `Install bullmq + deploy worker to auto-send review requests.`
  )

  // ── Audit log ────────────────────────────
  auditLog({
    action: 'trip_ended',
    operatorId: trip.operator_id,
    actorType: 'captain',
    actorIdentifier: `Token: ${tripId}`,
    entityType: 'trip',
    entityId: tripId,
    changes: {
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
      buoyPolicyId: trip.buoy_policy_id,
    },
  })

  // ── Notify operator ──────────────────────
  void supabase.from('operator_notifications').insert({
    operator_id: trip.operator_id,
    type: 'trip_ended',
    title: '✓ Trip completed',
    body: `${(trip.boats as any)?.boat_name} has returned`,
    data: { tripId },
  })

  return NextResponse.json({
    data: {
      ended: true,
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
    },
  })
}
