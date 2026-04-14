import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/trips/[slug]/board-guest
 *
 * Rapid boarding endpoint for QR scanner mode.
 * Looks up guest by qr_token, marks them as boarded (checked_in_at = NOW()).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  let body: { qrToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { qrToken } = body
  if (!qrToken) {
    return NextResponse.json({ error: 'qrToken is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Find the trip
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Find the guest by qr_token within this trip
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('id, full_name, checked_in_at')
    .eq('trip_id', trip.id)
    .eq('qr_token', qrToken)
    .is('deleted_at', null)
    .single()

  if (guestError || !guest) {
    return NextResponse.json(
      { error: 'Guest not found. Invalid QR code.' },
      { status: 404 }
    )
  }

  // Already boarded?
  if (guest.checked_in_at) {
    return NextResponse.json({
      success: true,
      alreadyBoarded: true,
      guestName: guest.full_name,
      boardedAt: guest.checked_in_at,
    })
  }

  // Mark as boarded
  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('guests')
    .update({ checked_in_at: now })
    .eq('id', guest.id)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update boarding status' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    alreadyBoarded: false,
    guestName: guest.full_name,
    boardedAt: now,
  })
}
