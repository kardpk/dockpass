'use client'

import { useState, useEffect } from 'react'
import { LayoutList, AlignJustify } from 'lucide-react'
import { TripCard } from '@/components/dashboard/TripCard'
import { CompactTripRow } from '@/components/dashboard/CompactTripRow'

const PREF_KEY = 'dockpass:trip-list-mode'

interface TripData {
  id:             string
  slug:           string
  trip_code:      string
  trip_date:      string
  departure_time: string
  duration_hours: number
  max_guests:     number
  status:         string
  requires_approval: boolean
  boat_name:      string
  marina_name:    string
  slip_number:    string | null
  guest_count:    number
  waivers_signed: number
}

interface GroupedDate {
  dateKey:      string
  dateLabel:    string
  trips:        TripData[]
}

interface Props {
  groups:        GroupedDate[]
  defaultCompact: boolean   // true if operator has 5+ boats
}

export function TripListClient({ groups, defaultCompact }: Props) {
  // Read localStorage preference, fallback to prop default
  const [compact, setCompact] = useState(defaultCompact)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(PREF_KEY)
    if (saved !== null) {
      setCompact(saved === 'compact')
    }
    setHydrated(true)
  }, [])

  function toggle() {
    const next = !compact
    setCompact(next)
    localStorage.setItem(PREF_KEY, next ? 'compact' : 'full')
  }

  // Avoid flash before hydration
  if (!hydrated) return null

  return (
    <div>
      {/* ── View toggle ───────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'flex-end',
        marginBottom:   12,
      }}>
        <button
          onClick={toggle}
          title={compact ? 'Switch to card view' : 'Switch to compact view'}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            padding:    '6px 12px',
            fontSize:   11,
            fontWeight: 600,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            border:     '1px solid var(--color-border)',
            background: 'var(--color-bone)',
            color:      'var(--color-ink-secondary)',
            cursor:     'pointer',
          }}
        >
          {compact
            ? <><LayoutList size={13} /> Cards</>
            : <><AlignJustify size={13} /> Compact</>}
        </button>
      </div>

      {/* ── Date groups ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 0 : 'var(--s-8)' }}>
        {groups.map(({ dateKey, dateLabel, trips }) => (
          <section key={dateKey} style={{ marginBottom: compact ? 20 : 0 }}>
            {/* Date group kicker */}
            <div
              className="font-mono"
              style={{
                fontSize:      'var(--t-mono-xs)',
                fontWeight:    600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'var(--color-ink-muted)',
                paddingBottom: compact ? 6 : 'var(--s-3)',
                borderBottom:  '1px solid var(--color-line-soft)',
                marginBottom:  compact ? 0 : 'var(--s-3)',
              }}
            >
              {dateLabel}
            </div>

            {/* Trips */}
            {compact ? (
              /* ── Compact rows ── */
              <div>
                {trips.map(trip => (
                  <CompactTripRow
                    key={trip.id}
                    id={trip.id}
                    slug={trip.slug}
                    tripCode={trip.trip_code}
                    tripDate={trip.trip_date}
                    departureTime={trip.departure_time}
                    boatName={trip.boat_name}
                    slipNumber={trip.slip_number}
                    guestCount={trip.guest_count}
                    maxGuests={trip.max_guests}
                    status={trip.status}
                  />
                ))}
              </div>
            ) : (
              /* ── Full TripCards ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                {trips.map(trip => (
                  <TripCard
                    key={trip.id}
                    tripId={trip.id}
                    slug={trip.slug}
                    tripCode={trip.trip_code}
                    tripDate={trip.trip_date}
                    departureTime={trip.departure_time}
                    durationHours={trip.duration_hours}
                    maxGuests={trip.max_guests}
                    status={trip.status as 'upcoming' | 'active' | 'completed' | 'cancelled'}
                    boatName={trip.boat_name}
                    marinaName={trip.marina_name}
                    slipNumber={trip.slip_number}
                    guestCount={trip.guest_count}
                    waiversSigned={trip.waivers_signed}
                    requiresApproval={trip.requires_approval}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
