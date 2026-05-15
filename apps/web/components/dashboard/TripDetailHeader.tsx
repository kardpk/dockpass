import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
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

export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  const statusLabel: Record<string, string> = {
    upcoming: 'Upcoming',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <header className="td-header">
      {/* Nav row */}
      <div className="td-header-nav">
        <Link href="/dashboard/trips" className="td-header-back">
          <ChevronLeft size={14} strokeWidth={2} />
          All trips
        </Link>
        <span className={`td-status-dot ${trip.status}`}>
          {statusLabel[trip.status] ?? trip.status}
        </span>
      </div>

      {/* Hero: name + code badge — single compact row */}
      <div className="td-header-hero">
        <h1 className="td-header-boat">{trip.boat.boatName}</h1>
        <div className="td-code-badge">
          <span className="td-code-label">Code</span>
          <span className="td-code-value">{trip.tripCode}</span>
        </div>
      </div>

      {/* Meta: everything on one line */}
      <div className="td-header-meta">
        {formatDate(trip.tripDate)}
        <span className="td-meta-sep">·</span>
        {trip.departureTime.slice(0, 5)}
        <span className="td-meta-sep">·</span>
        {formatDur(trip.durationHours)}
        {trip.boat.marinaName && (
          <>
            <span className="td-meta-sep">·</span>
            <MapPin size={10} strokeWidth={2} style={{ color: 'var(--td-faint)', flexShrink: 0 }} />
            {trip.boat.marinaName}
            {trip.boat.slipNumber && (
              <span style={{ color: 'var(--td-faint)' }}>Slip {trip.boat.slipNumber}</span>
            )}
          </>
        )}
      </div>

      {/* Insurance notice — only when active */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div className="td-alert td-alert-ok" style={{ marginTop: 10 }}>
          <span style={{ fontSize: 12 }}>Insurance active · Policy {trip.buoyPolicyId}</span>
        </div>
      )}
    </header>
  )
}
