import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { LanguageSelector } from './LanguageSelector'
import { Calendar, Clock, Timer, Anchor } from 'lucide-react'
import type { TripT } from '@/lib/i18n/tripTranslations'
import type { SupportedLang } from '@/lib/i18n/detect'

interface TripHeroProps {
  boatName: string
  tripDate: string
  departureTime: string
  durationHours: number
  marinaName: string
  charterType: 'captained' | 'bareboat' | 'both'
  currentLang: SupportedLang
  tr: TripT
}

export function TripHero({
  boatName,
  tripDate,
  departureTime,
  durationHours,
  marinaName,
  charterType,
  currentLang,
  tr,
}: TripHeroProps) {
  const chips: { Icon: typeof Calendar; label: string }[] = [
    { Icon: Calendar, label: formatTripDate(tripDate) },
    { Icon: Clock, label: formatTime(departureTime) },
    { Icon: Timer, label: formatDuration(durationHours) },
    { Icon: Anchor, label: tr.charterType[charterType] },
  ]

  return (
    <section
      style={{
        background: 'var(--color-ink)',
        padding: 'var(--s-5) var(--s-5) var(--s-8)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-5)' }}>
        <span
          className="font-mono"
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Boatcheckin
        </span>
        <LanguageSelector currentLang={currentLang} />
      </div>

      {/* Boat name */}
      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#fff',
          lineHeight: 1.1,
          marginBottom: 'var(--s-4)',
        }}
      >
        {boatName}
      </h1>

      {/* Trip details pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        {chips.map((chip) => (
          <span
            key={chip.label}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: 'var(--r-1)',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <chip.Icon size={13} strokeWidth={2} />
            {chip.label}
          </span>
        ))}
      </div>

      {/* Marina */}
      <p
        className="font-mono"
        style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', letterSpacing: '0.04em' }}
      >
        {marinaName}
      </p>
    </section>
  )
}
