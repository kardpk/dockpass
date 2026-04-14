import { NextRequest, NextResponse } from 'next/server'
import { verifyCaptainToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const schema = z.object({
  guestId: z.string().uuid(),
  verifierName: z.string().min(2, 'Verifier name required').max(100),
})

/**
 * POST /api/captain/[token]/verify-livery
 *
 * Dockmaster Dual-Signature via Captain Snapshot (token-based auth).
 * Same logic as the dashboard endpoint but authenticated via HMAC token
 * instead of operator session.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Verify HMAC token
  const payload = verifyCaptainToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  // 2. Parse body
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Guest ID and verifier name are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // 3. Verify guest belongs to this trip and is in correct state
  const { data: guest, error: fetchError } = await supabase
    .from('guests')
    .select('id, full_name, trip_id, operator_id, approval_status')
    .eq('id', parsed.data.guestId)
    .eq('trip_id', payload.tripId)
    .single()

  if (fetchError || !guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  if (guest.approval_status !== 'pending_livery_briefing') {
    return NextResponse.json(
      { error: 'Guest is not pending livery briefing' },
      { status: 409 }
    )
  }

  // 4. Execute dual-signature
  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('guests')
    .update({
      approval_status: 'approved',
      approved_at: now,
      livery_briefing_verified_at: now,
      livery_briefing_verified_by: parsed.data.verifierName,
    })
    .eq('id', parsed.data.guestId)

  if (updateError) {
    console.error('[captain/verify-livery] update failed:', updateError)
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }

  // 5. Audit log
  auditLog({
    action: 'livery_briefing_verified',
    operatorId: guest.operator_id,
    actorType: 'captain',
    actorIdentifier: `captain-token:${payload.tripId}`,
    entityType: 'guest',
    entityId: parsed.data.guestId,
    changes: {
      guestName: guest.full_name,
      tripId: guest.trip_id,
      verifierName: parsed.data.verifierName,
      verifiedAt: now,
      previousStatus: 'pending_livery_briefing',
      newStatus: 'approved',
    },
  })

  return NextResponse.json({
    data: {
      id: parsed.data.guestId,
      status: 'approved',
      liveryBriefingVerifiedAt: now,
      liveryBriefingVerifiedBy: parsed.data.verifierName,
    },
  })
}
