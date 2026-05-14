import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import { formatTripDate, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { OperatorTripDetail } from '@/types'

/**
 * TripDetailHeader — V3 Design Language
 *
 * Source Serif 4 boat name, JetBrains Mono trip metadata,
 * V3 badge for status, gold trip code.
 */
export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* ── Back nav + status badge ─────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: '1px solid var(--border, #dde2ea)',
        }}
      >
        <Link
          href="/dashboard/trips"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: 'var(--ink, #111c2d)', textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--sans, sans-serif)',
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          All trips
        </Link>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* ── Boat name + trip info ────────────────────────────── */}
      <div style={{ paddingTop: 20 }}>
        <h1
          style={{
            fontFamily: 'var(--serif, Georgia, serif)',
            fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink, #111c2d)',
            lineHeight: 1.12,
          }}
        >
          {trip.boat.boatName}
        </h1>

        {/* Trip meta row — date · time · duration */}
        <div
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--body, #374151)',
            letterSpacing: '0.06em',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {formatTripDate(trip.tripDate)} · {trip.departureTime.slice(0, 5)} · {formatDuration(trip.durationHours)}
        </div>

        {/* Location row */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 4,
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
            fontFamily: 'var(--sans, sans-serif)',
          }}
        >
          <MapPin size={12} strokeWidth={2} />
          {trip.boat.marinaName}
          {trip.boat.slipNumber ? ` · Slip ${trip.boat.slipNumber}` : ''}
        </div>
      </div>

      {/* ── Trip code ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px dashed var(--border, #dde2ea)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--muted, #6b7280)',
          }}
        >
          Code
        </span>
        <span
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 24, fontWeight: 900,
            letterSpacing: '0.15em',
            color: 'var(--gold, #c9a227)',
          }}
        >
          {trip.tripCode}
        </span>
      </div>

      {/* ── Insurance notice (if active) ─────────────────────── */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--v-soft, #ecfdf5)',
            border: '1px solid rgba(5,150,105,0.25)',
            borderLeft: '3px solid var(--verified, #059669)',
            borderRadius: '0 4px 4px 0',
            fontSize: 13,
            color: 'var(--verified, #059669)',
            fontFamily: 'var(--sans, sans-serif)',
          }}
        >
          Insurance active · Policy {trip.buoyPolicyId}
        </div>
      )}
    </div>
  )
}
