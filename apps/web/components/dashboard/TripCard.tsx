'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { TripStatus } from '@/types'

interface TripCardProps {
  tripId: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  boatName: string
  marinaName: string
  slipNumber: string | null
  guestCount: number
  waiversSigned: number
  requiresApproval: boolean
}

/** Status → left accent stripe color */
const ACCENT: Record<string, string> = {
  active:    'var(--color-status-ok)',
  upcoming:  'var(--color-brass)',
  completed: 'var(--color-ink-muted)',
  cancelled: 'var(--color-status-err)',
}

/**
 * TripCard — Editorial trip row tile (MASTER_DESIGN §9.3 + §9.7)
 *
 * Dense, scannable card with left status accent stripe,
 * Fraunces boat name, promoted trip code badge.
 */
export function TripCard({
  tripId,
  tripCode,
  departureTime,
  durationHours,
  maxGuests,
  status,
  boatName,
  marinaName,
  slipNumber,
  guestCount,
  waiversSigned,
  requiresApproval,
}: TripCardProps) {
  const accentColor = ACCENT[status] ?? 'var(--color-ink-muted)'
  const checkinRatio = maxGuests > 0 ? guestCount / maxGuests : 0

  return (
    <Link
      href={`/dashboard/trips/${tripId}`}
      className="tile"
      style={{
        display: 'flex',
        gap: 'var(--s-3)',
        padding: '12px 16px',
        textDecoration: 'none',
        transition: 'background var(--dur-fast) var(--ease)',
        cursor: 'pointer',
        borderLeft: `4px solid ${accentColor}`,
        position: 'relative',
      }}
    >
      {/* ── Departure time (left column) ──────────────── */}
      <div
        className="font-mono"
        style={{
          flexShrink: 0,
          width: 52,
          paddingTop: 2,
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          {departureTime.slice(0, 5)}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.04em',
            marginTop: 4,
          }}
        >
          {formatDuration(durationHours)}
        </div>
      </div>

      {/* ── Trip info (main column) ───────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Boat name + trip code badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s-2)' }}>
          <div style={{ minWidth: 0 }}>
            {/* Boat name — display font, prominent */}
            <p
              className="font-display"
              style={{
                fontSize: '19px',
                fontWeight: 500,
                color: 'var(--color-ink)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {boatName}
            </p>
            {/* Location — inline, compact */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                marginTop: 4,
                fontSize: '13px', color: 'var(--color-ink-muted)',
              }}
            >
              <MapPin size={11} strokeWidth={2} />
              <span>{marinaName}{slipNumber ? ` · Slip ${slipNumber}` : ''}</span>
            </div>
          </div>

          {/* Trip code — E-1: two-tier badge: CODE label + value, distinct from status pills */}
          <div
            className="mono"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              background: 'rgba(184,74,31,0.07)',
              border: '1px solid rgba(184,74,31,0.18)',
              padding: '3px 8px',
              borderRadius: 'var(--r-1)',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              lineHeight: 1,
            }}>
              code
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--color-rust)',
              lineHeight: 1,
            }}>
              {tripCode}
            </span>
          </div>
        </div>

        {/* Row 2: Guest stats + status + waiver count */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--color-line-soft)',
          }}
        >
          <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
            {/* Check-in count with progress bar */}
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {guestCount}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink-muted)' }}>
                /{maxGuests}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-ink-muted)', marginLeft: 4 }}>
                checked in
              </span>
              {/* Mini progress bar */}
              <div style={{ marginTop: 3, height: 2, width: 60, background: 'var(--color-line-soft)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${Math.min(checkinRatio * 100, 100)}%`, background: checkinRatio >= 1 ? 'var(--color-status-ok)' : 'var(--color-rust)', borderRadius: 1, transition: 'width 300ms ease' }} />
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
              {waiversSigned} waiver{waiversSigned !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
            {requiresApproval && (
              <span className="pill pill--warn" style={{ fontSize: '9px' }}>
                Approval
              </span>
            )}
            <TripStatusBadge status={status} />
          </div>
        </div>
      </div>
    </Link>
  )
}
