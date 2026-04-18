import { Check, X } from 'lucide-react'
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
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)', padding: 'var(--s-3) var(--s-4)' }}
    >
      {/* House rules — left accent border block */}
      {houseRuleLines.length > 0 && (
        <div style={{ marginBottom: customDos.length > 0 || customDonts.length > 0 ? 'var(--s-3)' : 0 }}>
          <SectionLabel label={tr.rules} />
          <div
            style={{
              borderLeft: '3px solid var(--color-ink)',
              paddingLeft: 'var(--s-3)',
              display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
            }}
          >
            {houseRuleLines.map((rule, idx) => (
              <p
                key={idx}
                style={{
                  fontSize: '13px',
                  color: 'var(--color-ink)',
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {rule}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* DOs — green accent */}
      {customDos.length > 0 && (
        <div style={{ marginBottom: customDonts.length > 0 ? 'var(--s-3)' : 0 }}>
          <SectionLabel label={tr.dos} color="var(--color-status-ok)" />
          <div
            style={{
              borderLeft: '3px solid var(--color-status-ok)',
              paddingLeft: 'var(--s-3)',
              display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
            }}
          >
            {customDos.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Check size={12} strokeWidth={3} style={{ color: 'var(--color-status-ok)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DON'Ts — red accent */}
      {customDonts.length > 0 && (
        <div>
          <SectionLabel label={tr.donts} color="var(--color-status-err)" />
          <div
            style={{
              borderLeft: '3px solid var(--color-status-err)',
              paddingLeft: 'var(--s-3)',
              display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
            }}
          >
            {customDonts.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <X size={12} strokeWidth={3} style={{ color: 'var(--color-status-err)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom rule sections */}
      {customRuleSections.map((section) => (
        <div
          key={section.id}
          style={{ marginTop: 'var(--s-3)' }}
        >
          <SectionLabel label={section.title} />
          <div
            style={{
              borderLeft: '3px solid var(--color-line)',
              paddingLeft: 'var(--s-3)',
              display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
            }}
          >
            {section.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                {section.type === 'numbered' && (
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', flexShrink: 0, marginTop: 1, minWidth: 16 }}>
                    {idx + 1}.
                  </span>
                )}
                {section.type === 'check' && <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: 2 }} />}
                <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        color: color ?? 'var(--color-ink)',
        display: 'block',
        marginBottom: 'var(--s-2)',
      }}
    >
      {label}
    </span>
  )
}
