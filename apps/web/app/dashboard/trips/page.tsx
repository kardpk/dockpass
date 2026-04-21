import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { TripListClient } from '@/components/dashboard/TripListClient'
import { correctTripStatus, isTripRelevant } from '@/lib/utils/tripStatus'
import { Anchor, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trips — BoatCheckin' }

// ─── Date grouping helpers ────────────────────────────────────────────────────

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  }).toUpperCase()
}

interface TripRow {
  id:               string
  slug:             string
  trip_code:        string
  trip_date:        string
  departure_time:   string
  duration_hours:   number
  max_guests:       number
  status:           string
  special_notes:    string | null
  requires_approval: boolean
  boats: { boat_name: string; marina_name: string; slip_number: string | null; lat: number | null; lng: number | null } | null
  guests: { id: string; waiver_signed: boolean }[]
}

export default async function TripsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const [{ data: trips }, { count: boatCount }] = await Promise.all([
    supabase
      .from('trips')
      .select(`
        id, slug, trip_code, trip_date, departure_time,
        duration_hours, max_guests, status, special_notes,
        requires_approval,
        boats ( boat_name, marina_name, slip_number, lat, lng ),
        guests ( id, waiver_signed )
      `)
      .eq('operator_id', operator.id)
      .in('status', ['upcoming', 'active'])
      .is('guests.deleted_at', null)
      .order('trip_date', { ascending: true })
      .order('departure_time', { ascending: true })
      .limit(50),
    supabase
      .from('boats')
      .select('id', { count: 'exact', head: true })
      .eq('operator_id', operator.id)
      .eq('is_active', true),
  ])

  const rawTrips = (trips ?? []) as unknown as TripRow[]

  // Read-time date correction: filter past trips and correct stale statuses
  const upcomingTrips = rawTrips
    .filter(t => isTripRelevant(t.trip_date))
    .map(t => ({ ...t, status: correctTripStatus(t.trip_date, t.status) }))
    .filter(t => t.status === 'upcoming' || t.status === 'active')

  // Group by date
  const grouped = new Map<string, TripRow[]>()
  for (const trip of upcomingTrips) {
    const key = trip.trip_date
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(trip)
  }

  // Build serialisable groups for the client component
  const groups = Array.from(grouped.entries()).map(([dateKey, dateTrips]) => ({
    dateKey,
    dateLabel: formatGroupDate(dateKey),
    trips: dateTrips.map(trip => {
      const guests = trip.guests ?? []
      const boat   = trip.boats as { boat_name: string; marina_name: string; slip_number: string | null } | null
      return {
        id:               trip.id,
        slug:             trip.slug,
        trip_code:        trip.trip_code,
        trip_date:        trip.trip_date,
        departure_time:   trip.departure_time,
        duration_hours:   trip.duration_hours,
        max_guests:       trip.max_guests,
        status:           trip.status,
        requires_approval: trip.requires_approval,
        boat_name:        boat?.boat_name   ?? '',
        marina_name:      boat?.marina_name ?? '',
        slip_number:      boat?.slip_number ?? null,
        guest_count:      guests.length,
        waivers_signed:   guests.filter(g => g.waiver_signed).length,
      }
    }),
  }))

  // Default to compact if operator has 5+ boats (fleet-scale operator)
  const defaultCompact = (boatCount ?? 0) >= 5

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-6)' }}>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)', lineHeight: 1.1 }}
          >
            Trips
          </h1>
          <p
            className="font-mono"
            style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 6 }}
          >
            {upcomingTrips.length} upcoming
          </p>
        </div>
        <Link href="/dashboard/trips/new" className="btn btn--rust">
          <Plus size={14} strokeWidth={2.5} />
          New trip
        </Link>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {upcomingTrips.length === 0 ? (
        /* Empty state */
        <div
          className="tile text-center"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 'var(--s-16) var(--s-8)',
            gap: 'var(--s-4)',
            borderStyle: 'dashed',
          }}
        >
          <Anchor size={32} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} />
          <h2
            className="font-display"
            style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
          >
            No trips yet
          </h2>
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', maxWidth: 280 }}>
            Create your first trip and share the link with your guests.
          </p>
          <Link href="/dashboard/trips/new" className="btn btn--rust" style={{ marginTop: 'var(--s-2)' }}>
            Create my first trip
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        /* TripListClient handles compact/full toggle via localStorage */
        <TripListClient groups={groups} defaultCompact={defaultCompact} />
      )}
    </div>
  )
}
