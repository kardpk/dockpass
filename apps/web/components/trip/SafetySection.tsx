import { ShieldCheck, Check, Phone } from 'lucide-react'
import { SafetyExpand } from './SafetyExpand'
import type { SafetyPoint } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface SafetySectionProps {
  safetyPoints: SafetyPoint[]
  tr: TripT
}

export function SafetySection({ safetyPoints, tr }: SafetySectionProps) {
  const alwaysVisible = safetyPoints.slice(0, 4)
  const expandable = safetyPoints.slice(4)

  return (
    <div
      className="tile"
      style={{
        margin: '0 var(--s-4)', marginTop: 'var(--s-3)',
        padding: 'var(--s-3) var(--s-4)',
        background: 'var(--color-bone)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)' }}>
        <ShieldCheck size={14} strokeWidth={2.5} style={{ color: 'var(--color-ink)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink)',
          }}
        >
          {tr.safety}
        </span>
        <span className="badge" style={{ marginLeft: 'auto', fontSize: '10px' }}>
          {safetyPoints.length} points
        </span>
      </div>

      {/* Points — compact list */}
      <div
        style={{
          borderLeft: '3px solid var(--color-ink)',
          paddingLeft: 'var(--s-3)',
          display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
        }}
      >
        {alwaysVisible.map((point) => (
          <div
            key={point.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}
          >
            <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45, margin: 0 }}>
              {point.text}
            </p>
          </div>
        ))}
      </div>

      {/* Expandable */}
      {expandable.length > 0 && (
        <SafetyExpand points={expandable} label={tr.safetyExpand} />
      )}

      {/* noscript */}
      <noscript>
        <div
          style={{
            borderLeft: '3px solid var(--color-ink)',
            paddingLeft: 'var(--s-3)',
            display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
            marginTop: 'var(--s-2)',
          }}
        >
          {expandable.map((point) => (
            <div key={point.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45, margin: 0 }}>{point.text}</p>
            </div>
          ))}
        </div>
      </noscript>

      {/* Emergency — compact */}
      <div
        style={{
          marginTop: 'var(--s-3)',
          paddingTop: 'var(--s-2)',
          borderTop: '1px dashed var(--color-line-soft)',
          display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
        }}
      >
        <Phone size={12} strokeWidth={2.5} style={{ color: 'var(--color-ink-muted)' }} />
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
          {tr.coastGuard} &mdash; {tr.vhf16}
        </span>
      </div>
    </div>
  )
}
