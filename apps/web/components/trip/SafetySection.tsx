import { ShieldCheck, Check } from 'lucide-react'
import { SafetyExpand } from './SafetyExpand'
import type { SafetyPoint } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface SafetySectionProps {
  safetyPoints: SafetyPoint[]
  tr: TripT
}

export function SafetySection({ safetyPoints, tr }: SafetySectionProps) {
  const alwaysVisible = safetyPoints.slice(0, 3)
  const expandable = safetyPoints.slice(3)

  return (
    <div
      className="tile"
      style={{
        margin: '0 var(--s-4)', marginTop: 'var(--s-3)',
        background: 'var(--color-bone)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-4)' }}>
        <ShieldCheck size={16} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink)',
          }}
        >
          {tr.safety}
        </span>
      </div>

      {/* Always-visible points */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {alwaysVisible.map((point) => (
          <SafetyPointItem key={point.id} point={point} />
        ))}
      </ul>

      {/* Expandable extra points */}
      {expandable.length > 0 && (
        <SafetyExpand points={expandable} label={tr.safetyExpand} />
      )}

      {/* noscript: show all */}
      <noscript>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: 'var(--s-2)' }}>
          {expandable.map((point) => (
            <SafetyPointItem key={point.id} point={point} />
          ))}
        </ul>
      </noscript>

      {/* Emergency contacts */}
      <div
        style={{
          marginTop: 'var(--s-4)',
          paddingTop: 'var(--s-3)',
          borderTop: '1px dashed var(--color-line-soft)',
        }}
      >
        <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--s-1)' }}>
          {tr.emergency}
        </p>
        <p className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
          {tr.coastGuard} &mdash; {tr.vhf16}
        </p>
      </div>
    </div>
  )
}

function SafetyPointItem({ point }: { point: SafetyPoint }) {
  return (
    <li
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)',
        padding: 'var(--s-2) 0',
        borderBottom: '1px solid var(--color-line-soft)',
      }}
    >
      <div
        style={{
          width: 18, height: 18,
          borderRadius: 'var(--r-1)',
          background: 'var(--color-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />
      </div>
      <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.5 }}>
        {point.text}
      </p>
    </li>
  )
}
