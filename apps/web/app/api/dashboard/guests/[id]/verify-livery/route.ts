import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const schema = z.object({
  verifierName: z.string().min(2, 'Verifier name required').max(100),
})

/**
 * POST /api/dashboard/guests/[id]/verify-livery
 *
 * Dockmaster Dual-Signature: Confirms that in-person vessel instruction
 * was delivered to the guest per FWC Chapter 327 requirements.
 *
 * Transitions: pending_livery_briefing → approved
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Verifier name is required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify guest exists, belongs to operator, and is in correct state
  const { data: guest, error: fetchError } = await supabase
    .from('guests')
    .select('id, full_name, trip_id, approval_status')
    .eq('id', id)
    .eq('operator_id', operator.id)
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

  // Execute the dual-signature: transition to approved
  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('guests')
    .update({
      approval_status: 'approved',
      approved_at: now,
      livery_briefing_verified_at: now,
      livery_briefing_verified_by: parsed.data.verifierName,
    })
    .eq('id', id)
    .eq('operator_id', operator.id)

  if (updateError) {
    console.error('[verify-livery] update failed:', updateError)
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }

  // Audit log — this is the cryptographic record
  auditLog({
    action: 'livery_briefing_verified',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'guest',
    entityId: id,
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
      id,
      status: 'approved',
      liveryBriefingVerifiedAt: now,
      liveryBriefingVerifiedBy: parsed.data.verifierName,
    },
  })
}
