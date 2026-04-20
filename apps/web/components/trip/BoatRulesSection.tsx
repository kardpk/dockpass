import { Check, X, Anchor } from 'lucide-react'
import type { CustomRuleSection } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface BoatRulesSectionProps {
  houseRules: string | null
  customDos: string[]
  customDonts: string[]
  customRuleSections: CustomRuleSection[]
  tr: TripT
}

/**
 * Intelligently parse the houseRules blob.
 * Captains often enter everything in one textarea — house rules, DOs, DON'Ts
 * all concatenated. We split on known markers to extract the right items.
 */
function parseHouseRulesBlob(raw: string): { rules: string[]; dos: string[]; donts: string[] } {
  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean)

  const rules: string[] = []
  const dos: string[] = []
  const donts: string[] = []
  let currentSection: 'rules' | 'dos' | 'donts' = 'rules'

  for (const line of lines) {
    // Detect section markers
    if (/^(house\s*rules)\s*:?\s*$/i.test(line)) { currentSection = 'rules'; continue }
    if (/^(do'?s?)\s*:?\s*$/i.test(line) || /^(dos?\s*[-–—]\s*)/i.test(line)) { currentSection = 'dos'; continue }
    if (/^(don'?t'?s?)\s*:?\s*$/i.test(line) || /^(don'?ts?\s*[-–—]\s*)/i.test(line)) { currentSection = 'donts'; continue }

    // Items starting with ✓/✔/√ → DOs
    if (/^[✓✔√]\s+/.test(line)) {
      dos.push(line.replace(/^[✓✔√]\s+/, ''))
      continue
    }
    // Items starting with ✗/✘/×/X → DON'Ts
    if (/^[✗✘×]\s+/.test(line) || /^x\s+/i.test(line) && currentSection === 'donts') {
      donts.push(line.replace(/^[✗✘×]\s+/, '').replace(/^x\s+/i, ''))
      continue
    }

    // Route to current section
    if (currentSection === 'dos') dos.push(line)
    else if (currentSection === 'donts') donts.push(line)
    else rules.push(line)
  }

  return { rules, dos, donts }
}

export function BoatRulesSection({
  houseRules,
  customDos,
  customDonts,
  customRuleSections,
  tr,
}: BoatRulesSectionProps) {
  // Parse the blob + merge with explicit arrays
  const parsed = parseHouseRulesBlob(houseRules ?? '')
  const finalRules = parsed.rules
  const finalDos = [...parsed.dos, ...customDos]
  const finalDonts = [...parsed.donts, ...customDonts]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}>

      {/* ══════════════════════════════════════════════════
          HOUSE RULES — Navy marine blue
          ══════════════════════════════════════════════════ */}
      {finalRules.length > 0 && (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Navy banner header */}
          <div
            style={{
              background: 'var(--color-ink)',
              padding: 'var(--s-3) var(--s-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
            }}
          >
            <Anchor size={14} strokeWidth={2.5} style={{ color: '#fff' }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#fff',
              }}
            >
              {tr.rules}
            </span>
            <span
              className="font-mono"
              style={{
                marginLeft: 'auto',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {finalRules.length} rules
            </span>
          </div>
          <div style={{ padding: 'var(--s-2) var(--s-3) var(--s-3)', display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
            {finalRules.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)',
                  padding: 'var(--s-2) var(--s-3)',
                  background: 'var(--color-bone)',
                  borderRadius: 'var(--r-1)',
                  borderLeft: '3px solid var(--color-ink)',
                }}
              >
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', flexShrink: 0, minWidth: 18, marginTop: 1 }}>
                  {idx + 1}.
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                  {rule.replace(/^\d+[\.\)]\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          DOs — Green
          ══════════════════════════════════════════════════ */}
      {finalDos.length > 0 && (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Green banner header */}
          <div
            style={{
              background: 'var(--color-status-ok)',
              padding: 'var(--s-3) var(--s-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
            }}
          >
            <Check size={14} strokeWidth={3} style={{ color: '#fff' }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#fff',
              }}
            >
              {tr.dos}
            </span>
            <span
              className="font-mono"
              style={{
                marginLeft: 'auto',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {finalDos.length} items
            </span>
          </div>
          <div style={{ padding: 'var(--s-2) var(--s-3) var(--s-3)', display: 'flex', flexDirection: 'column', gap: 'var(--s-1)', background: 'var(--color-status-ok-soft)' }}>
            {finalDos.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)',
                  padding: 'var(--s-2) var(--s-3)',
                  background: 'var(--color-paper)',
                  borderRadius: 'var(--r-1)',
                  borderLeft: '3px solid var(--color-status-ok)',
                }}
              >
                <Check size={12} strokeWidth={3} style={{ color: 'var(--color-status-ok)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          DON'Ts — Rusty Red
          ══════════════════════════════════════════════════ */}
      {finalDonts.length > 0 && (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Rusty red banner header */}
          <div
            style={{
              background: 'var(--color-rust)',
              padding: 'var(--s-3) var(--s-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
            }}
          >
            <X size={14} strokeWidth={3} style={{ color: '#fff' }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#fff',
              }}
            >
              {tr.donts}
            </span>
            <span
              className="font-mono"
              style={{
                marginLeft: 'auto',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {finalDonts.length} items
            </span>
          </div>
          <div style={{ padding: 'var(--s-2) var(--s-3) var(--s-3)', display: 'flex', flexDirection: 'column', gap: 'var(--s-1)', background: 'var(--color-status-err-soft)' }}>
            {finalDonts.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)',
                  padding: 'var(--s-2) var(--s-3)',
                  background: 'var(--color-paper)',
                  borderRadius: 'var(--r-1)',
                  borderLeft: '3px solid var(--color-rust)',
                }}
              >
                <X size={12} strokeWidth={3} style={{ color: 'var(--color-rust)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom sections ── */}
      {customRuleSections.map((section) => (
        <div key={section.id} className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              background: 'var(--color-bone)',
              padding: 'var(--s-3) var(--s-4)',
              borderBottom: '1px solid var(--color-line-soft)',
            }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
              {section.title}
            </span>
          </div>
          <div style={{ padding: 'var(--s-2) var(--s-3) var(--s-3)', display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
            {section.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)',
                  padding: 'var(--s-2) var(--s-3)',
                  background: 'var(--color-bone)',
                  borderRadius: 'var(--r-1)',
                  borderLeft: '3px solid var(--color-line)',
                }}
              >
                {section.type === 'numbered' && (
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', flexShrink: 0, minWidth: 16, marginTop: 1 }}>
                    {idx + 1}.
                  </span>
                )}
                {section.type === 'check' && <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: 2 }} />}
                <span style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                  {section.type === 'numbered' ? item.replace(/^\d+[\.\)]\s*/, '') : item}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
