import { Check, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { CustomRuleSection } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface BoatRulesSectionProps {
  houseRules: string | null
  customDos: string[]
  customDonts: string[]
  customRuleSections: CustomRuleSection[]
  tr: TripT
}

/** Filter out raw section headers that captains sometimes embed in the text */
const HEADER_NOISE = /^(house\s*rules|dos?|don'?ts?)\s*:?\s*$/i

function cleanItems(items: string[]): string[] {
  return items.filter(item => !HEADER_NOISE.test(item.trim()))
}

export function BoatRulesSection({
  houseRules,
  customDos,
  customDonts,
  customRuleSections,
  tr,
}: BoatRulesSectionProps) {
  const houseRuleLines = cleanItems(
    houseRules ? houseRules.split('\n').map(s => s.trim()).filter(Boolean) : []
  )
  const doItems = cleanItems(customDos)
  const dontItems = cleanItems(customDonts)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}>
      {/* ── HOUSE RULES ── */}
      {houseRuleLines.length > 0 && (
        <RulesCard
          heading={tr.rules}
          subheading="Non-negotiable vessel rules"
          pillLabel="Required"
          pillClass="pill pill--err"
          PillIcon={AlertCircle}
          stripeColor="var(--color-status-err)"
          bgTint="var(--color-paper)"
        >
          {houseRuleLines.map((rule, idx) => (
            <RuleItem key={idx} text={rule} stripeColor="var(--color-status-err)" />
          ))}
        </RulesCard>
      )}

      {/* ── DOs — light green tint ── */}
      {doItems.length > 0 && (
        <RulesCard
          heading={tr.dos}
          subheading="Positive guidance for your trip"
          pillLabel="Encouraged"
          pillClass="pill pill--ok"
          PillIcon={CheckCircle2}
          stripeColor="var(--color-status-ok)"
          bgTint="var(--color-status-ok-soft)"
        >
          {doItems.map((item, idx) => (
            <RuleItem key={idx} text={item} stripeColor="var(--color-status-ok)" icon={<Check size={12} strokeWidth={3} style={{ color: 'var(--color-status-ok)' }} />} />
          ))}
        </RulesCard>
      )}

      {/* ── DON'Ts — light rusty-red tint ── */}
      {dontItems.length > 0 && (
        <RulesCard
          heading={tr.donts}
          subheading="Prohibited on this vessel"
          pillLabel="Prohibited"
          pillClass="pill pill--warn"
          PillIcon={AlertTriangle}
          stripeColor="var(--color-status-err)"
          bgTint="var(--color-status-err-soft)"
        >
          {dontItems.map((item, idx) => (
            <RuleItem key={idx} text={item} stripeColor="var(--color-status-err)" icon={<X size={12} strokeWidth={3} style={{ color: 'var(--color-status-err)' }} />} />
          ))}
        </RulesCard>
      )}

      {/* ── Custom sections ── */}
      {customRuleSections.map((section) => (
        <RulesCard
          key={section.id}
          heading={section.title}
          pillLabel="Custom"
          pillClass="pill pill--ghost"
          PillIcon={AlertCircle}
          stripeColor="var(--color-line)"
          bgTint="var(--color-paper)"
        >
          {section.items.map((item, idx) => (
            <RuleItem
              key={idx}
              text={item}
              stripeColor="var(--color-line)"
              icon={
                section.type === 'numbered'
                  ? <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', minWidth: 16 }}>{idx + 1}.</span>
                  : section.type === 'check'
                    ? <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)' }} />
                    : undefined
              }
            />
          ))}
        </RulesCard>
      ))}
    </div>
  )
}

/* ── Card wrapper ── */

function RulesCard({
  heading,
  subheading,
  pillLabel,
  pillClass,
  PillIcon,
  stripeColor,
  bgTint,
  children,
}: {
  heading: string
  subheading?: string
  pillLabel: string
  pillClass: string
  PillIcon: typeof AlertCircle
  stripeColor: string
  bgTint: string
  children: React.ReactNode
}) {
  return (
    <div
      className="tile"
      style={{
        padding: 0, overflow: 'hidden',
        background: bgTint,
        borderLeft: `4px solid ${stripeColor}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--s-3) var(--s-4)',
          borderBottom: '1px solid var(--color-line-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-3)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="font-display"
            style={{
              fontSize: 'var(--t-body-lg)',
              fontWeight: 600,
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {heading}
          </h3>
          {subheading && (
            <p
              className="font-mono"
              style={{ fontSize: '11px', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}
            >
              {subheading}
            </p>
          )}
        </div>
        <span className={pillClass} style={{ fontSize: '10px', flexShrink: 0 }}>
          <PillIcon size={10} strokeWidth={2} />
          {pillLabel}
        </span>
      </div>

      {/* Items */}
      <div
        style={{
          padding: 'var(--s-2) var(--s-4) var(--s-3)',
          display: 'flex', flexDirection: 'column',
          gap: 'var(--s-1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Single rule item ── */

function RuleItem({
  text,
  stripeColor,
  icon,
}: {
  text: string
  stripeColor: string
  icon?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-2)',
        background: 'var(--color-paper)',
        border: '1px solid var(--color-line-soft)',
        borderRadius: 'var(--r-1)',
        borderLeft: `3px solid ${stripeColor}`,
        minHeight: 40,
        padding: '0 var(--s-3)',
      }}
    >
      {icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span
        style={{
          fontSize: 'var(--t-body-sm)',
          color: 'var(--color-ink)',
          lineHeight: 1.45,
          padding: 'var(--s-2) 0',
        }}
      >
        {text}
      </span>
    </div>
  )
}
