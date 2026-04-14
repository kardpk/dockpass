'use client'

import { useEffect, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { GuestSafetyCard } from '@/components/trip/GuestSafetyCard'
import type { JoinFlowState, SafetyAck } from '@/types'
import type { GuestSafetyCardData } from '@/lib/trip/getTripPageData'
import type { ComplianceRules } from '@/lib/compliance/rules'

// ── USCG/FWC Dynamic Safety Card Filter ────────────────────────────────────────
// Filters the full card set based on charter type (bareboat vs. captained)
// and USCG vessel length thresholds (e.g., ECOS law < 26ft).
// Then sorts injected compliance topics to the TOP of the deck.
function filterAndPrioritizeSafetyCards(
  cards: GuestSafetyCardData[],
  charterType: string,
  lengthFt: number | null,
  injectedTopics: string[],
): GuestSafetyCardData[] {
  const filtered = cards.filter(card => {
    const target = card.compliance_target ?? 'all'

    // Charter type filter
    if (target === 'bareboat_only' && charterType === 'captained') return false
    if (target === 'passengers_only' && charterType !== 'captained') return false

    // USCG vessel length filter (e.g., ECOS law applies only to boats < 26ft)
    if (card.max_length_ft && lengthFt != null && lengthFt >= card.max_length_ft) return false
    if (card.min_length_ft && lengthFt != null && lengthFt < card.min_length_ft) return false

    return true
  })

  // Prioritize injected compliance topics (e.g., CA PWC: off_throttle_steering first)
  if (injectedTopics.length === 0) return filtered

  const prioritized: GuestSafetyCardData[] = []
  const rest: GuestSafetyCardData[] = []

  for (const card of filtered) {
    if (injectedTopics.includes(card.topic_key)) {
      prioritized.push(card)
    } else {
      rest.push(card)
    }
  }

  // Sort prioritized cards in the same order as injectedTopics
  prioritized.sort((a, b) =>
    injectedTopics.indexOf(a.topic_key) - injectedTopics.indexOf(b.topic_key)
  )

  return [...prioritized, ...rest]
}

interface StepSafetyProps {
  /** Merged safety cards (Captain photos + dictionary text/audio) */
  safetyCards: GuestSafetyCardData[]
  /** Charter type from the trip (for compliance filtering) */
  charterType: string
  /** Vessel length in feet (for USCG length-based filtering) */
  lengthFt: number | null
  /** State compliance rules (for injected safety topic prioritization) */
  complianceRules?: ComplianceRules | null
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepSafety({ safetyCards, charterType, lengthFt, complianceRules, state, onUpdate, onNext, onBack }: StepSafetyProps) {
  // Apply USCG/FWC compliance filter + state-specific topic prioritization
  const applicableCards = useMemo(
    () => filterAndPrioritizeSafetyCards(
      safetyCards,
      charterType,
      lengthFt,
      complianceRules?.injected_safety_topics ?? [],
    ),
    [safetyCards, charterType, lengthFt, complianceRules]
  )

  const current = state.currentSafetyCard
  const total = applicableCards.length
  const card = applicableCards[current]
  const allAcknowledged = state.safetyAcks.length >= total

  // If no safety cards configured — skip step after mount
  useEffect(() => {
    if (total === 0) onNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (total === 0) return null

  function acknowledge() {
    if (!card) return
    const ack: SafetyAck = {
      topic_key: card.topic_key,
      acknowledgedAt: new Date().toISOString(),
    }
    const newAcks = [...state.safetyAcks, ack]
    const nextCard = current + 1
    onUpdate({ safetyAcks: newAcks, currentSafetyCard: nextCard })
  }

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 mb-4 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#0D1B2A]">Safety briefing</h2>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            {allAcknowledged
              ? 'All safety cards reviewed ✓'
              : `${state.safetyAcks.length} of ${total} reviewed`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#E8F2FB] flex items-center justify-center text-[13px] font-bold text-[#0C447C]">
          {Math.min(state.safetyAcks.length, total)}/{total}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {applicableCards.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i < state.safetyAcks.length
                ? 'w-2 h-2 bg-[#1D9E75]'
                : i === current && !allAcknowledged
                ? 'w-3 h-3 bg-[#0C447C]'
                : 'w-2 h-2 bg-[#D0E2F3]'
            )}
          />
        ))}
      </div>

      {/* Safety card or completion state */}
      {!allAcknowledged && card ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
          >
            <GuestSafetyCard
              imageUrl={card.image_url}
              title={card.title}
              instructions={card.instructions}
              audioUrl={card.audio_url}
              emoji={card.emoji}
              captainNote={card.captainInstructions || null}
              cardIndex={current + 1}
              totalCards={total}
              onAcknowledge={acknowledge}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#E8F9F4] rounded-[20px] p-6 border border-[#1D9E75]/30 text-center"
        >
          <div className="text-[48px] mb-3">✅</div>
          <h3 className="text-[18px] font-bold text-[#1D9E75] mb-2">Safety briefing complete</h3>
          <p className="text-[14px] text-[#6B7C93]">
            You&apos;ve acknowledged all {total} safety cards.
          </p>
        </motion.div>
      )}

      {/* Continue — only after all acknowledged */}
      {allAcknowledged && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full h-[56px] rounded-[12px] mt-4 bg-[#0C447C] text-white font-semibold text-[16px] hover:bg-[#093a6b] transition-colors"
        >
          Continue to waiver →
        </motion.button>
      )}
    </div>
  )
}
