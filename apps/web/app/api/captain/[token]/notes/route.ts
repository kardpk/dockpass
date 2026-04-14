import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const notesSchema = z.object({
  notes: z.string().max(5000),
})

// ═══════════════════════════════════════════════════════════════
// PATCH /api/captain/[token]/notes
// Save captain's trip notes/log
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const limited = await rateLimit(req, { max: 30, window: 60, key: `captain:notes:${token.slice(0, 8)}` })
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
  const parsed = notesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const tripId = tokenResult.tripId

  // ── Update trip notes ──
  const { error } = await supabase
    .from('trips')
    .update({ captain_notes: parsed.data.notes })
    .eq('id', tripId)

  if (error) {
    console.error('[captain:notes]', error.message)
    return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })
  }

  // Audit log
  const { data: trip } = await supabase
    .from('trips')
    .select('operator_id')
    .eq('id', tripId)
    .single()

  if (trip?.operator_id) {
    await auditLog({
      action: 'captain_notes_updated',
      operatorId: trip.operator_id,
      actorType: 'captain',
      actorIdentifier: 'Captain Token',
      entityType: 'trip',
      entityId: tripId,
      changes: { notesLength: parsed.data.notes.length },
    })
  }

  return NextResponse.json({ data: { saved: true } })
}
