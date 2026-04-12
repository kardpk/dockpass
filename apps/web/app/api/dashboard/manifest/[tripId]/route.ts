import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { generateManifest } from '@/lib/pdf/manifest'
import { buildAddonSummary, shapeTripDetail } from '@/lib/dashboard/getDashboardData'
import { auditLog } from '@/lib/security/audit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 30, window: 3600,
    key: `manifest:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const supabase = await createClient()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at, buoy_policy_id,
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_cards
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', tripId)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = shapeTripDetail(raw as Record<string, unknown>)
  const addonSummary = buildAddonSummary(trip.guests)

  const pdfBytes = await generateManifest(
    trip,
    operator.full_name ?? 'Operator',
    addonSummary
  )

  auditLog({
    action: 'manifest_downloaded',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'trip',
    entityId: tripId,
    changes: { guestCount: trip.guests.length },
  })

  const filename = `dockpass-manifest-${trip.boat.boatName.replace(/\s+/g, '-').toLowerCase()}-${trip.tripDate}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBytes.length.toString(),
      'Cache-Control': 'no-store',
    },
  })
}
