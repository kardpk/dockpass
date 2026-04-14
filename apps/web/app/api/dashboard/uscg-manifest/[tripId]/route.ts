import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { formatTripDate, formatTime } from '@/lib/utils/format'

/**
 * USCG 46 CFR §185.502 — Crew & Passenger List
 *
 * Generates a CSV formatted specifically for Coast Guard inspection.
 * Required for international and overnight voyages; recommended for all
 * high-volume commercial operations.
 *
 * Fields: Passenger Name, Emergency Contact Name, Emergency Contact Phone,
 * Waiver Status, Boarded At
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 30, window: 3600,
    key: `uscg-manifest:${operator.id}`,
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
      id, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      safety_briefing_confirmed_at, safety_briefing_confirmed_by,
      safety_briefing_type, safety_briefing_topics,
      boats (
        boat_name, marina_name, slip_number,
        captain_name
      ),
      guests (
        full_name,
        emergency_contact_name,
        emergency_contact_phone,
        waiver_signed,
        checked_in_at
      )
    `)
    .eq('id', tripId)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = raw as Record<string, unknown>
  const boat = (trip.boats ?? {}) as Record<string, unknown>
  const guests = (trip.guests ?? []) as Record<string, unknown>[]

  const boatName = (boat.boat_name as string) ?? 'Unknown Vessel'
  const captainName = (boat.captain_name as string) ?? 'Not assigned'
  const marinaName = (boat.marina_name as string) ?? ''
  const tripDate = formatTripDate((trip.trip_date as string) ?? '')
  const departureTime = formatTime((trip.departure_time as string) ?? '')
  const tripCode = (trip.trip_code as string) ?? ''

  // ── Build USCG-formatted CSV ──────────────────────────────────
  const csvRows: string[][] = [
    ['USCG 46 CFR §185.502 — PASSENGER MANIFEST'],
    [],
    [`Vessel: ${boatName}`],
    [`Captain: ${captainName}`],
    [`Marina: ${marinaName}`],
    [`Date: ${tripDate}`],
    [`Departure: ${departureTime}`],
    [`Trip Code: ${tripCode}`],
    [`Total Passengers: ${guests.length}`],
    [`Max Capacity: ${trip.max_guests}`],
    [`Charter Type: ${(trip.charter_type as string) ?? 'captained'}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    // Safety Briefing Attestation
    ['SAFETY BRIEFING ATTESTATION'],
    ...(trip.safety_briefing_confirmed_at
      ? [
          [`Status: CONFIRMED`],
          [`Confirmed By: ${(trip.safety_briefing_confirmed_by as string) ?? 'N/A'}`],
          [`Briefing Type: ${((trip.safety_briefing_type as string) ?? 'N/A').replace(/_/g, ' ')}`],
          [`Confirmed At: ${(trip.safety_briefing_confirmed_at as string) ?? 'N/A'}`],
          [`Topics Covered: ${((trip.safety_briefing_topics as string[]) ?? []).join('; ')}`],
        ]
      : [
          [`Status: ⚠️ NOT YET CONFIRMED`],
          [`Note: Captain has not confirmed delivering verbal safety orientation per 46 CFR §185.506`],
        ]
    ),
    [],
    ['#', 'Passenger Name', 'Emergency Contact Name', 'Emergency Contact Phone', 'Waiver Status', 'Boarded At'],
  ]

  guests.forEach((g, i) => {
    csvRows.push([
      String(i + 1),
      escapeCSV((g.full_name as string) ?? 'N/A'),
      escapeCSV((g.emergency_contact_name as string) ?? 'N/A'),
      escapeCSV((g.emergency_contact_phone as string) ?? 'N/A'),
      (g.waiver_signed as boolean) ? 'Signed' : 'Pending',
      (g.checked_in_at as string) ?? 'Not boarded',
    ])
  })

  const csvString = csvRows.map(row => row.join(',')).join('\n')

  // Audit log
  auditLog({
    action: 'uscg_manifest_downloaded',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'trip',
    entityId: tripId,
    changes: { guestCount: guests.length, format: 'csv' },
  })

  const filename = `USCG_Manifest_${boatName.replace(/\s+/g, '_')}_${tripDate.replace(/\s+/g, '_')}.csv`

  return new NextResponse(csvString, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

/** Escape CSV field — wrap in quotes if it contains commas, quotes, or newlines */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
