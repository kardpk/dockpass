import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { generateCaptainToken, calculateSnapshotExpiry } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Fetch current version — verify operator owns this trip
  const { data: trip } = await supabase
    .from('trips')
    .select('id, operator_id, captain_token_version, trip_date, departure_time')
    .eq('id', id)
    .eq('operator_id', operator.id)
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const newVersion = (trip.captain_token_version ?? 1) + 1
  const expiresAt = calculateSnapshotExpiry(trip.trip_date, trip.departure_time, 3)
  const { token } = generateCaptainToken(trip.id, newVersion, expiresAt)

  const { error } = await supabase
    .from('trips')
    .update({
      captain_token: token,
      captain_token_version: newVersion,
      captain_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', trip.id)

  if (error) {
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 500 })
  }

  return NextResponse.json({ token, expiresAt })
}
