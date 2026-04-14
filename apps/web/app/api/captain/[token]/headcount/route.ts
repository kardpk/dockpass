import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const headcountSchema = z.object({
  count: z.number().int().min(0).max(500),
})

// ═══════════════════════════════════════════════════════════════
// POST /api/captain/[token]/headcount
// Captain confirms physical head count before departure
// ═══════════════════════════════════════════════════════════════
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const limited = await rateLimit(req, { max: 10, window: 300, key: `captain:headcount:${token.slice(0, 8)}` })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ── Verify token ──
  const tokenResult = verifySnapshotToken(token)
  if (!tokenResult) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  if (tokenResult.expired) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 })
  }

  // ── Parse body ──
  const body = await req.json().catch(() => null)
  const parsed = headcountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const tripId = tokenResult.tripId
  const confirmedAt = new Date().toISOString()

  // ── Get digital guest count for comparison ──
  const { count: digitalCount } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .is('deleted_at', null)

  // ── Update trip ──
  const { error } = await supabase
    .from('trips')
    .update({
      head_count_confirmed: parsed.data.count,
      head_count_confirmed_at: confirmedAt,
    })
    .eq('id', tripId)

  if (error) {
    console.error('[captain:headcount]', error.message)
    return NextResponse.json({ error: 'Failed to save head count' }, { status: 500 })
  }

  const mismatch = digitalCount != null && parsed.data.count !== digitalCount

  // ── Audit log (USCG record) ──
  const { data: trip } = await supabase
    .from('trips')
    .select('operator_id')
    .eq('id', tripId)
    .single()

  if (trip?.operator_id) {
    await auditLog({
      action: 'head_count_confirmed',
      operatorId: trip.operator_id,
      actorType: 'captain',
      actorIdentifier: 'Captain Token',
      entityType: 'trip',
      entityId: tripId,
      changes: {
        physicalCount: parsed.data.count,
        digitalCount: digitalCount ?? 0,
        mismatch,
        confirmedAt,
      },
    })

    // If mismatch, notify operator
    if (mismatch) {
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'head_count_mismatch',
        title: '⚠️ Head count mismatch',
        body: `Captain counted ${parsed.data.count} aboard but ${digitalCount} registered digitally.`,
        data: { tripId, physical: parsed.data.count, digital: digitalCount },
      })
    }
  }

  return NextResponse.json({
    data: {
      confirmed: true,
      physicalCount: parsed.data.count,
      digitalCount: digitalCount ?? 0,
      mismatch,
      confirmedAt,
    },
  })
}
