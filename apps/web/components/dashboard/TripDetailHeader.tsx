import Link from 'next/link'
import { ChevronLeft, MapPin, Calendar, Clock } from 'lucide-react'
import type { OperatorTripDetail } from '@/types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatDur(h: number) {
  if (h < 1) return `${Math.round(h * 60)}m`
  if (Number.isInteger(h)) return `${h}h`
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    upcoming:  'td-pill td-pill-gold',
    active:    'td-pill td-pill-ok',
    completed: 'td-pill td-pill-ghost',
    cancelled: 'td-pill td-pill-err',
  }
  return (
    <span className={map[status] ?? 'td-pill td-pill-ghost'}>
      {status}
    </span>
  )
}

export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <div className="td-header">
      {/* Nav row */}
      <div className="td-header-nav">
        <Link href="/dashboard/trips" className="td-header-back">
          <ChevronLeft size={15} strokeWidth={2.5} />
          All trips
        </Link>
        <StatusPill status={trip.status} />
      </div>

      {/* Boat name + trip code on same row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="td-header-boat" style={{ flex: 1 }}>
          {trip.boat.boatName}
        </h1>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--td-text-faint)', marginBottom: 2 }}>
            Code
          </div>
          <div className="td-header-code">{trip.tripCode}</div>
        </div>
      </div>

      {/* Date / time / duration */}
      <div className="td-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <Calendar size={11} strokeWidth={2} style={{ color: 'var(--td-text-faint)' }} />
        {formatDate(trip.tripDate)}
        <span style={{ color: 'var(--td-text-faint)' }}>·</span>
        <Clock size={11} strokeWidth={2} style={{ color: 'var(--td-text-faint)' }} />
        {trip.departureTime.slice(0, 5)}
        <span style={{ color: 'var(--td-text-faint)' }}>·</span>
        {formatDur(trip.durationHours)}
      </div>

      {/* Location */}
      <div className="td-header-location">
        <MapPin size={11} strokeWidth={2} />
        {trip.boat.marinaName}
        {trip.boat.slipNumber && <span style={{ color: 'var(--td-text-faint)' }}>· Slip {trip.boat.slipNumber}</span>}
      </div>

      {/* Insurance notice */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div className="td-alert td-alert-ok" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 12 }}>Insurance active · Policy {trip.buoyPolicyId}</span>
        </div>
      )}
    </div>
  )
}
