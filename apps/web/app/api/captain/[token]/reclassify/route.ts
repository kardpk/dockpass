import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'

const VALID_PURPOSES = [
  'commercial', 'private_party', 'family',
  'fishing_social', 'corporate', 'training', 'other',
] as const

/**
 * PATCH /api/captain/[token]/reclassify
 * 
 * Allows mid-trip reclassification of trip purpose.
 * Records the previous purpose and timestamp for audit.
 * Operator can upgrade from private → commercial mid-trip.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const { tripPurpose, forceFullCompliance } = body

  if (!tripPurpose || !VALID_PURPOSES.includes(tripPurpose)) {
    return NextResponse.json(
      { error: 'Invalid trip purpose' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // 1. Resolve the trip from captain token
  const { data: tokenRow } = await supabase
    .from('captain_snapshot_tokens')
    .select('trip_id, operator_id')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 2. Get current purpose for audit trail
  const { data: trip } = await supabase
    .from('trips')
    .select('id, trip_purpose, status')
    .eq('id', tokenRow.trip_id)
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const previousPurpose = trip.trip_purpose

  // 3. Update trip with new purpose + reclassification audit
  const { error: updateError } = await supabase
    .from('trips')
    .update({
      trip_purpose: tripPurpose,
      force_full_compliance: forceFullCompliance ?? false,
      reclassified_from: previousPurpose,
      reclassified_at: new Date().toISOString(),
    })
    .eq('id', trip.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  // 4. Audit log
  auditLog({
    action: 'trip_reclassified',
    operatorId: tokenRow.operator_id,
    actorType: 'captain',
    actorIdentifier: token,
    entityType: 'trip',
    entityId: trip.id,
    changes: {
      from: previousPurpose,
      to: tripPurpose,
      forceFullCompliance: forceFullCompliance ?? false,
      tripStatus: trip.status,
    },
  })

  return NextResponse.json({
    data: {
      previousPurpose,
      newPurpose: tripPurpose,
      reclassifiedAt: new Date().toISOString(),
    },
  })
}
