'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import type { BriefingTopic } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BriefingType =
  | 'full_verbal'
  | 'abbreviated_with_cards'
  | 'pa_announcement'
  | 'reduced_private'

export interface BriefingAttestation {
  type: BriefingType
  topicsCovered: string[]
  signature: string
  confirmedAt: string
}

interface SafetyBriefingGateProps {
  boatName: string
  captainName: string
  tripDate: string
  guestCount: number
  briefingTopics: BriefingTopic[]
  complianceLevel: string
  token: string
  onConfirmed: (attestation: BriefingAttestation) => void
  onCancel: () => void
  /** Grace period: allow skipping with warning */
  allowSkip?: boolean
  onSkip?: () => void
}

const BRIEFING_TYPES: { id: BriefingType; icon: string; label: string; desc: string }[] = [
  {
    id: 'full_verbal',
    icon: '🎤',
    label: 'Full Verbal Briefing',
    desc: 'Spoke directly to all passengers',
  },
  {
    id: 'abbreviated_with_cards',
    icon: '📋',
    label: 'Abbreviated + Cards',
    desc: 'Distributed safety cards with brief announcement',
  },
  {
    id: 'pa_announcement',
    icon: '📢',
    label: 'PA Announcement',
    desc: 'Safety announcement via PA system',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function SafetyBriefingGate({
  boatName,
  captainName,
  tripDate,
  guestCount,
  briefingTopics,
  complianceLevel,
  token,
  onConfirmed,
  onCancel,
  allowSkip = false,
  onSkip,
}: SafetyBriefingGateProps) {
  const [selectedType, setSelectedType] = useState<BriefingType | null>(null)
  const [checkedTopics, setCheckedTopics] = useState<Set<string>>(new Set())
  const [signature, setSignature] = useState(captainName)
  const [isSaving, setIsSaving] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const requiredTopics = useMemo(
    () => briefingTopics.filter(t => t.required),
    [briefingTopics]
  )

  const allRequiredChecked = useMemo(
    () => requiredTopics.every(t => checkedTopics.has(t.id)),
    [requiredTopics, checkedTopics]
  )

  const canConfirm = selectedType && allRequiredChecked && signature.trim().length >= 2

  function toggleTopic(id: string) {
    setCheckedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || isSaving) return
    setIsSaving(true)

    const attestation: BriefingAttestation = {
      type: selectedType!,
      topicsCovered: Array.from(checkedTopics),
      signature: signature.trim(),
      confirmedAt: new Date().toISOString(),
    }

    // Pre-save to API (non-blocking on failure)
    try {
      await fetch(`/api/captain/${token}/briefing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attestation),
      })
    } catch {
      // Non-fatal — attestation will be sent again with trip start
    }

    setIsSaving(false)
    onConfirmed(attestation)
  }, [canConfirm, isSaving, selectedType, checkedTopics, signature, token, onConfirmed])

  // ─── Skip Warning Overlay ─────────────────────────────────────
  if (showSkipWarning) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-[#E8593C] px-5 pt-6 pb-5 text-white">
          <h1 className="text-[22px] font-bold">⚠️ Skip Safety Briefing?</h1>
        </div>
        <div className="flex-1 px-5 py-6 space-y-4">
          <div className="p-5 bg-[#FEF3DC] border-2 border-[#E5910A] rounded-[16px]">
            <p className="text-[15px] font-bold text-[#92400E] mb-2">
              Legal Exposure Warning
            </p>
            <p className="text-[13px] text-[#78350F] leading-relaxed">
              By skipping the safety briefing confirmation, you acknowledge that:
            </p>
            <ul className="mt-2 space-y-1.5">
              <li className="text-[13px] text-[#78350F] flex items-start gap-2">
                <span>•</span>
                <span>No digital record will exist proving a safety orientation was given</span>
              </li>
              <li className="text-[13px] text-[#78350F] flex items-start gap-2">
                <span>•</span>
                <span>The USCG manifest will show &quot;Safety Briefing: NOT CONFIRMED&quot;</span>
              </li>
              <li className="text-[13px] text-[#78350F] flex items-start gap-2">
                <span>•</span>
                <span>This may affect insurance claims in the event of an incident</span>
              </li>
            </ul>
            <p className="text-[12px] text-[#92400E] mt-3 font-semibold">
              This skip option will be removed in future updates.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSkipWarning(false)}
              className="flex-1 h-[52px] rounded-[12px] border border-[#D0E2F3] text-[#0D1B2A] font-semibold hover:bg-[#F5F8FC] transition-colors"
            >
              ← Go Back
            </button>
            <button
              onClick={() => onSkip?.()}
              className="flex-1 h-[52px] rounded-[12px] bg-[#E8593C] text-white font-semibold hover:bg-[#cc4a32] transition-colors"
            >
              Skip Anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main UI ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="bg-[#0C447C] px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white text-[14px]"
          >
            ← Back
          </button>
          <span className="text-[11px] font-bold tracking-wider opacity-70">
            46 CFR §185.506
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[28px]">🛡️</span>
          <div>
            <h1 className="text-[20px] font-bold">Safety Briefing Confirmation</h1>
            <p className="text-white/80 text-[13px]">
              Confirm you&apos;ve verbally briefed all {guestCount} passenger{guestCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <p className="text-white/60 text-[12px]">
          {boatName} · {tripDate}
          {complianceLevel === 'full' && ' · FULL COMPLIANCE'}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Step 1: Briefing Type */}
        <div>
          <h2 className="text-[14px] font-bold text-[#6B7C93] uppercase tracking-wider mb-3">
            Step 1 — How did you brief?
          </h2>
          <div className="space-y-2">
            {BRIEFING_TYPES.map(bt => (
              <button
                key={bt.id}
                onClick={() => setSelectedType(bt.id)}
                className={cn(
                  'w-full p-4 rounded-[14px] border-2 text-left transition-all',
                  selectedType === bt.id
                    ? 'border-[#0C447C] bg-[#E8F2FB]'
                    : 'border-[#D0E2F3] bg-white hover:bg-[#F5F8FC]'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">{bt.icon}</span>
                  <div>
                    <p className={cn(
                      'text-[14px] font-semibold',
                      selectedType === bt.id ? 'text-[#0C447C]' : 'text-[#0D1B2A]'
                    )}>
                      {bt.label}
                    </p>
                    <p className="text-[12px] text-[#6B7C93]">{bt.desc}</p>
                  </div>
                  {selectedType === bt.id && (
                    <span className="ml-auto text-[16px]">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Topic Checklist */}
        <div>
          <h2 className="text-[14px] font-bold text-[#6B7C93] uppercase tracking-wider mb-3">
            Step 2 — Topics Covered
          </h2>
          <div className="bg-[#F5F8FC] rounded-[16px] p-4 space-y-1">
            {briefingTopics.map(topic => (
              <label
                key={topic.id}
                className="flex items-start gap-3 py-3 cursor-pointer border-b border-[#D0E2F3] last:border-0"
              >
                <div
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    'w-6 h-6 rounded-[6px] border-2 flex items-center justify-center',
                    'transition-all duration-150 flex-shrink-0 mt-0.5',
                    checkedTopics.has(topic.id)
                      ? 'bg-[#1D9E75] border-[#1D9E75]'
                      : 'bg-white border-[#D0E2F3]'
                  )}
                >
                  {checkedTopics.has(topic.id) && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    'text-[14px] font-medium leading-tight',
                    checkedTopics.has(topic.id) ? 'text-[#6B7C93] line-through' : 'text-[#0D1B2A]'
                  )}>
                    {topic.label}
                    {topic.required && <span className="text-[#D63B3B] ml-1">*</span>}
                  </p>
                  <p className="text-[12px] text-[#6B7C93] mt-0.5">{topic.description}</p>
                </div>
                <span className="text-[10px] text-[#0C447C] bg-[#E8F2FB] px-2 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5">
                  {topic.cfrRef}
                </span>
              </label>
            ))}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-[#6B7C93]">
                {checkedTopics.size} / {briefingTopics.length} confirmed
              </span>
              {allRequiredChecked && (
                <span className="text-[12px] font-semibold text-[#1D9E75]">
                  ✓ All required topics covered
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Attestation */}
        <div>
          <h2 className="text-[14px] font-bold text-[#6B7C93] uppercase tracking-wider mb-3">
            Step 3 — Captain Attestation
          </h2>
          <div className="bg-[#F5F8FC] rounded-[16px] p-4 space-y-3">
            <p className="text-[13px] text-[#0D1B2A] leading-relaxed">
              &ldquo;I, <strong>{signature || '___'}</strong>, attest that I have verbally
              delivered the required safety orientation to all{' '}
              <strong>{guestCount} passenger{guestCount !== 1 ? 's' : ''}</strong>{' '}
              aboard <strong>{boatName}</strong> prior to departure, in
              compliance with 46 CFR §185.506.&rdquo;
            </p>

            <div>
              <label className="block text-[12px] font-medium text-[#6B7C93] mb-1.5">
                Your signature (type your name)
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Captain name"
                style={{ fontFamily: 'var(--font-satisfy, cursive)', fontSize: '22px', color: '#0C447C' }}
                className="w-full h-[52px] px-4 rounded-[10px] border border-[#D0E2F3] placeholder:text-[#D0E2F3] focus:outline-none focus:border-[#0C447C] bg-white"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-8 pt-4 bg-white border-t border-[#D0E2F3] space-y-3">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isSaving}
          className={cn(
            'w-full h-[56px] rounded-[14px] font-bold text-[16px]',
            'flex items-center justify-center gap-2',
            'transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            canConfirm
              ? 'bg-[#1D9E75] text-white hover:bg-[#178a64] active:scale-[0.98]'
              : 'bg-[#D0E2F3] text-[#6B7C93]'
          )}
        >
          {isSaving ? (
            <AnchorLoader size="sm" color="white" />
          ) : canConfirm ? (
            '🛡️ Confirm Briefing & Proceed'
          ) : (
            'Complete all steps above'
          )}
        </button>

        {/* Grace period skip */}
        {allowSkip && (
          <button
            onClick={() => setShowSkipWarning(true)}
            className="w-full text-[13px] text-[#6B7C93] underline py-2"
          >
            Skip for now (not recommended)
          </button>
        )}
      </div>
    </div>
  )
}
