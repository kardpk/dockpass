'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, FileText, MapPin, Clock, ArrowRight, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatTime, formatTripDate, formatDuration } from '@/lib/utils/format'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
import type { OperatorTripDetail } from '@/types'

export function TodayTripCard({ trip }: { trip: OperatorTripDetail }) {
  const { guests, connectionStatus } = useTripGuests(trip.id, trip.guests)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const signed   = guests.filter(g => g.waiverSigned).length
  const pending  = guests.filter(g => !g.waiverSigned).length
  const total    = guests.length
  const progress = trip.maxGuests > 0 ? (total / trip.maxGuests) * 100 : 0
  const allSigned = pending === 0 && total > 0

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const reminderMsg = [
    `Hi! Just a reminder about your charter tomorrow`,
    ``,
    `${total} of ${trip.maxGuests} guests checked in`,
    pending > 0
      ? `${pending} guest${pending !== 1 ? 's' : ''} still need${pending === 1 ? 's' : ''} to sign the waiver`
      : `All waivers signed!`,
    ``,
    `Join link: ${appUrl}/trip/${trip.slug}`,
    `Code: ${trip.tripCode}`,
  ].join('\n')

  async function copyReminder() {
    await navigator.clipboard.writeText(reminderMsg)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/dashboard/manifest/${trip.id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `manifest-${trip.tripDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const isActive = trip.status === 'active'

  return (
    <div className="tile tile--dark" style={{ overflow: 'hidden', padding: 0 }}>

      {/* ── Top accent stripe for active trips ── */}
      {isActive && (
        <div style={{ height: 3, background: 'var(--color-status-ok)', borderRadius: '2px 2px 0 0' }} />
      )}

      <div style={{ padding: '20px 22px 0' }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>

          {/* Left: vessel name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <div className="font-mono" style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(244,239,230,0.5)',
              marginBottom: 4,
            }}>
              {formatTripDate(trip.tripDate)}
            </div>

            {/* Vessel name — the headline */}
            <div className="font-display" style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              color: 'var(--color-bone)',
              lineHeight: 1.0,
            }}>
              {trip.boat.boatName}
            </div>

            {/* Time + Duration */}
            <div className="font-mono" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 8,
              fontSize: 13, fontWeight: 600,
              color: 'rgba(244,239,230,0.85)',
              letterSpacing: '0.04em',
            }}>
              <Clock size={12} strokeWidth={2} aria-hidden="true" />
              {formatTime(trip.departureTime)}
              <span style={{ color: 'rgba(244,239,230,0.4)', margin: '0 2px' }}>·</span>
              {formatDuration(trip.durationHours)}
            </div>

            {/* Marina */}
            {(trip.boat.slipNumber || trip.boat.marinaName) && (
              <div className="font-mono" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                marginTop: 4,
                fontSize: 11, fontWeight: 500,
                color: 'rgba(244,239,230,0.5)',
                letterSpacing: '0.02em',
              }}>
                <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                {trip.boat.slipNumber ? `Slip ${trip.boat.slipNumber} · ` : ''}{trip.boat.marinaName}
              </div>
            )}
          </div>

          {/* Right: status + live dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, marginLeft: 12 }}>
            <span className={cn('pill', isActive ? 'pill--ok' : 'pill--ghost')}
              style={!isActive ? { background: 'rgba(244,239,230,0.12)', color: 'rgba(244,239,230,0.7)', borderColor: 'rgba(244,239,230,0.2)' } : {}}>
              {isActive ? 'Active' : 'Today'}
            </span>
            <RealtimeIndicator status={connectionStatus} />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(244,239,230,0.1)', marginBottom: 16 }} />

        {/* ── Guest progress ── */}
        <div style={{ marginBottom: 16 }}>

          {/* Count row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-bone)', lineHeight: 1, letterSpacing: '-0.01em' }}>
                {total}
              </span>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(244,239,230,0.5)', letterSpacing: '0.02em' }}>
                / {trip.maxGuests}
              </span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: 'rgba(244,239,230,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 2 }}>
                checked in
              </span>
            </div>

            {/* Waivers */}
            <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, letterSpacing: '0.04em' }}>
              <Users size={10} strokeWidth={2} style={{ color: 'rgba(244,239,230,0.4)' }} />
              <span style={{ color: 'rgba(244,239,230,0.5)' }}>{signed} signed</span>
              {pending > 0 ? (
                <span style={{ color: 'var(--color-rust-soft)' }}>· {pending} pending</span>
              ) : total > 0 ? (
                <span style={{ color: 'var(--color-status-ok)' }}>· all signed</span>
              ) : null}
            </div>
          </div>

          {/* Progress bar — thicker, more readable */}
          <div style={{
            width: '100%', height: 6,
            background: 'rgba(244,239,230,0.12)',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              background: allSigned ? 'var(--color-status-ok)' : progress >= 50 ? 'var(--color-brass)' : 'var(--color-rust)',
              borderRadius: 3,
              transition: 'width 700ms var(--ease)',
            }} />
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ padding: '0 22px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf || guests.length === 0}
          className="btn btn--sm"
          style={{
            background: 'rgba(244,239,230,0.08)',
            border: '1px solid rgba(244,239,230,0.18)',
            color: guests.length === 0 ? 'rgba(244,239,230,0.3)' : 'var(--color-bone)',
            fontWeight: 600,
          }}
        >
          {downloadingPdf
            ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            : <FileText size={14} strokeWidth={2} aria-hidden="true" />
          }
          {downloadingPdf ? 'Generating…' : 'Download PDF'}
        </button>

        <button
          onClick={copyReminder}
          className="btn btn--sm"
          style={{
            background: copiedMsg ? 'rgba(72,199,142,0.15)' : 'rgba(244,239,230,0.08)',
            border: copiedMsg ? '1px solid rgba(72,199,142,0.4)' : '1px solid rgba(244,239,230,0.18)',
            color: copiedMsg ? 'var(--color-status-ok)' : 'var(--color-bone)',
            fontWeight: 600,
            transition: 'all 200ms ease',
          }}
        >
          {copiedMsg ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          {copiedMsg ? 'Copied!' : 'Copy reminder'}
        </button>
      </div>

      {/* ── View full guest list ── */}
      <div style={{ borderTop: '1px solid rgba(244,239,230,0.1)' }}>
        <Link
          href={`/dashboard/trips/${trip.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 22px',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(244,239,230,0.55)',
            textDecoration: 'none',
            transition: 'color 140ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-bone)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,230,0.55)')}
        >
          View full guest list
          <ArrowRight size={12} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
