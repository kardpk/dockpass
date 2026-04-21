'use client'

import Link from 'next/link'

interface CompactTripRowProps {
  id:             string
  slug:           string
  tripCode:       string
  tripDate:       string
  departureTime:  string
  boatName:       string
  slipNumber:     string | null
  guestCount:     number
  maxGuests:      number
  status:         string
}

const STATUS_COLOR: Record<string, string> = {
  active:    'var(--color-green)',
  upcoming:  'var(--color-amber)',
  completed: 'var(--color-ink-secondary)',
  cancelled: 'var(--color-rust)',
}

const STATUS_LABEL: Record<string, string> = {
  active:    'ACTIVE',
  upcoming:  'UPCOMING',
  completed: 'DONE',
  cancelled: 'CANCELLED',
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function CompactTripRow({
  id, slug, tripCode, departureTime,
  boatName, slipNumber, guestCount, maxGuests, status,
}: CompactTripRowProps) {
  const color = STATUS_COLOR[status] ?? 'var(--color-ink-secondary)'
  const label = STATUS_LABEL[status] ?? status.toUpperCase()

  return (
    <Link
      href={`/dashboard/trips/${id}`}
      style={{
        display:        'grid',
        gridTemplateColumns: '56px 1fr 80px 48px 80px',
        alignItems:     'center',
        gap:            8,
        minHeight:      52,
        padding:        '0 16px',
        borderLeft:     `3px solid ${color}`,
        borderBottom:   '1px solid var(--color-border)',
        background:     'var(--color-surface)',
        textDecoration: 'none',
        transition:     'background .12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bone)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
    >
      {/* Time */}
      <span style={{
        fontFamily:  'var(--font-mono)',
        fontSize:    13,
        fontWeight:  600,
        color:       'var(--color-ink)',
      }}>
        {formatTime(departureTime)}
      </span>

      {/* Boat + slip */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {boatName}
        </div>
        {slipNumber && (
          <div style={{ fontSize: 11, color: 'var(--color-ink-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Slip {slipNumber}
          </div>
        )}
      </div>

      {/* Code */}
      <span style={{
        fontFamily:     'var(--font-mono)',
        fontSize:       11,
        color:          'var(--color-ink-secondary)',
        textTransform:  'uppercase',
        letterSpacing:  '.06em',
      }}>
        {tripCode}
      </span>

      {/* Guests */}
      <span style={{
        fontFamily:  'var(--font-mono)',
        fontSize:    13,
        color:       guestCount >= maxGuests ? 'var(--color-rust)' : 'var(--color-ink-secondary)',
        textAlign:   'right',
      }}>
        {guestCount}/{maxGuests}
      </span>

      {/* Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
        <span style={{
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   color,
          flexShrink:   0,
        }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '.06em' }}>{label}</span>
      </div>
    </Link>
  )
}
