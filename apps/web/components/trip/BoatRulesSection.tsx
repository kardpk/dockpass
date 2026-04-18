import { Check, X, BookOpen } from 'lucide-react'
import type { CustomRuleSection } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface BoatRulesSectionProps {
  houseRules: string | null
  customDos: string[]
  customDonts: string[]
  customRuleSections: CustomRuleSection[]
  tr: TripT
}

export function BoatRulesSection({
  houseRules,
  customDos,
  customDonts,
  customRuleSections,
  tr,
}: BoatRulesSectionProps) {
  const houseRuleLines = houseRules
    ? houseRules.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div
      className="tile"
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-4)' }}>
        <BookOpen size={16} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink)',
          }}
        >
          {tr.rules}
        </span>
      </div>

      {/* House rules */}
      {houseRuleLines.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--s-3)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {houseRuleLines.map((rule, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)', fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)' }}>
              <span style={{ color: 'var(--color-ink-muted)', marginTop: 2, flexShrink: 0 }}>&bull;</span>
              {rule}
            </li>
          ))}
        </ul>
      )}

      {/* DOs */}
      {customDos.length > 0 && (
        <div style={{ marginBottom: 'var(--s-3)' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: 'var(--color-status-ok)',
              display: 'block',
              marginBottom: 'var(--s-2)',
            }}
          >
            {tr.dos}
          </span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {customDos.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)', fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)' }}>
                <Check size={14} strokeWidth={2.5} style={{ color: 'var(--color-status-ok)', flexShrink: 0, marginTop: 2 }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DON'Ts */}
      {customDonts.length > 0 && (
        <div style={{ marginBottom: 'var(--s-3)' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: 'var(--color-status-err)',
              display: 'block',
              marginBottom: 'var(--s-2)',
            }}
          >
            {tr.donts}
          </span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {customDonts.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)', fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)' }}>
                <X size={14} strokeWidth={2.5} style={{ color: 'var(--color-status-err)', flexShrink: 0, marginTop: 2 }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom rule sections */}
      {customRuleSections.map((section, i) => (
        <div
          key={section.id}
          style={{
            paddingTop: i > 0 ? 'var(--s-3)' : 0,
            borderTop: i > 0 ? '1px dashed var(--color-line-soft)' : 'none',
            marginTop: i > 0 ? 'var(--s-3)' : 0,
          }}
        >
          <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
            {section.title}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {section.items.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)', fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)' }}>
                <span className="font-mono" style={{ color: 'var(--color-ink-muted)', flexShrink: 0, marginTop: 1, fontSize: '12px' }}>
                  {section.type === 'numbered' ? `${idx + 1}.` : section.type === 'check' ? '' : '\u2022'}
                </span>
                {section.type === 'check' && <Check size={13} strokeWidth={2.5} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: 2 }} />}
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
