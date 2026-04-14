import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'

/**
 * PATCH /api/captain/[token]/briefing
 * 
 * Pre-saves the captain's safety briefing attestation.
 * Called from SafetyBriefingGate before the trip starts.
 * 46 CFR §185.506 compliance record.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const { type, topicsCovered, signature, confirmedAt } = body

  if (!type || !topicsCovered?.length || !signature) {
    return NextResponse.json(
      { error: 'Missing briefing attestation data' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Resolve trip from captain token
  const { data: tokenRow } = await supabase
    .from('captain_snapshot_tokens')
    .select('trip_id, operator_id')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Store briefing attestation
  const { error: updateError } = await supabase
    .from('trips')
    .update({
      safety_briefing_confirmed_at: confirmedAt,
      safety_briefing_confirmed_by: signature,
      safety_briefing_topics: topicsCovered,
      safety_briefing_type: type,
      safety_briefing_signature: signature,
    })
    .eq('id', tokenRow.trip_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save briefing' }, { status: 500 })
  }

  // Audit log
  auditLog({
    action: 'safety_briefing_confirmed',
    operatorId: tokenRow.operator_id,
    actorType: 'captain',
    actorIdentifier: token,
    entityType: 'trip',
    entityId: tokenRow.trip_id,
    changes: {
      briefingType: type,
      topicsCovered,
      captainSignature: signature,
    },
  })

  return NextResponse.json({
    data: { saved: true, confirmedAt },
  })
}
