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
    upcoming: 'td-pill td-pill-navy',
    active: 'td-pill td-pill-ok',
    completed: 'td-pill td-pill-ghost',
    cancelled: 'td-pill td-pill-err',
  }
  const labels: Record<string, string> = {
    upcoming: 'Upcoming', active: '● Active', completed: 'Completed', cancelled: 'Cancelled',
  }
  return <span className={map[status] ?? 'td-pill td-pill-ghost'}>{labels[status] ?? status}</span>
}

export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <header className="td-header">
      {/* Nav */}
      <div className="td-header-nav">
        <Link href="/dashboard/trips" className="td-header-back">
          <ChevronLeft size={14} strokeWidth={2.5} />
          All trips
        </Link>
        <StatusPill status={trip.status} />
      </div>

      {/* Boat name + code badge */}
      <div className="td-header-main">
        <h1 className="td-header-boat">{trip.boat.boatName}</h1>

        {/* ← The ONLY gold-on-navy element on the page */}
        <div className="td-code-badge">
          <span className="td-code-badge-label">Code</span>
          <span className="td-code-badge-value">{trip.tripCode}</span>
        </div>
      </div>

      {/* Meta: date · time · duration */}
      <div className="td-header-meta">
        <Calendar size={10} strokeWidth={2} />
        {formatDate(trip.tripDate)}
        <span className="td-header-sep">·</span>
        <Clock size={10} strokeWidth={2} />
        {trip.departureTime.slice(0, 5)}
        <span className="td-header-sep">·</span>
        {formatDur(trip.durationHours)}
      </div>

      {/* Location */}
      <div className="td-header-location">
        <MapPin size={10} strokeWidth={2} />
        {trip.boat.marinaName}
        {trip.boat.slipNumber && (
          <span style={{ color: 'var(--td-navy-faint)' }}>· Slip {trip.boat.slipNumber}</span>
        )}
      </div>

      {/* Insurance notice */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div className="td-alert td-alert-ok" style={{ marginTop: 10 }}>
          <span style={{ fontSize: 12 }}>Insurance active · Policy {trip.buoyPolicyId}</span>
        </div>
      )}
    </header>
  )
}
