'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { StepCode } from './StepCode'
import { StepDetails } from './StepDetails'
import { StepSafety } from './StepSafety'
import { StepWaiver } from './StepWaiver'
import { StepBoarding } from './StepBoarding'
import type { JoinStep, JoinFlowState } from '@/types'
import type { GuestSafetyCardData } from '@/lib/trip/getTripPageData'
import { getComplianceRules } from '@/lib/compliance/rules'
import type { ComplianceRules } from '@/lib/compliance/rules'

interface JoinFlowSheetProps {
  isOpen: boolean
  onClose: () => void
  tripSlug: string
  tripData: {
    boatName: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    tripDate: string
    departureTime: string
    durationHours: number
    charterType: 'captained' | 'bareboat' | 'both'
    tripPurpose: string
    addons: {
      id: string
      name: string
      description: string | null
      emoji: string
      priceCents: number
      maxQuantity: number
    }[]
    isEU: boolean
  }
  currentLang: string
}

// Beta: simplified flow — no insurance, no addons
const STEPS: JoinStep[]             = ['code', 'details', 'safety', 'waiver', 'boarding']
const FAST_TRACK_STEPS: JoinStep[]  = ['code', 'details', 'waiver', 'boarding']
const RELAXED_STEPS: JoinStep[]     = ['code', 'details', 'waiver', 'boarding']

const INITIAL_STATE: JoinFlowState = {
  step: 'code',
  tripCode: '', codeError: '', codeAttempts: 0,
  codeLocked: false, codeLockUntil: 0, turnstileToken: '',
  fullName: '', emergencyContactName: '',
  emergencyContactPhone: '', dietaryRequirements: '',
  languagePreference: 'en',
  dateOfBirth: '', isNonSwimmer: false,
  isSeaSicknessProne: false,
  gdprConsent: false, marketingConsent: false,
  isEU: false,
  fwcLicenseUrl: null, fwcLicenseUploading: false,
  safetyAcks: [], currentSafetyCard: 0,
  waiverScrolled: false, waiverAgreed: false,
  signatureText: '', waiverTextHash: '',
  addonQuantities: {},
  guestId: '', qrToken: '',
  approvalStatus: null,
  requiresCourse: false,
  isSubmitting: false, submitError: '',
}

export function JoinFlowSheet({
  isOpen, onClose, tripSlug, tripData, currentLang,
}: JoinFlowSheetProps) {
  const [state, setState] = useState<JoinFlowState>({
    ...INITIAL_STATE,
    languagePreference: currentLang,
    isEU: tripData.isEU,
  })

  // Data received after step 1 validates the code
  const [validatedTrip, setValidatedTrip] = useState<{
    waiverHash: string
    firmaTemplateId: string | null
    safetyCards: GuestSafetyCardData[]
    lengthFt: number | null
    boatType: string
    stateCode: string
  } | null>(null)

  // Compute compliance rules from validated trip data
  const complianceRules: ComplianceRules | null = validatedTrip
    ? getComplianceRules(
        validatedTrip.stateCode,
        validatedTrip.boatType,
        tripData.charterType,
      )
    : null

  const updateState = useCallback((partial: Partial<JoinFlowState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  function goToStep(step: JoinStep) {
    setState(prev => ({ ...prev, step }))
    document.getElementById('join-sheet-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Progress bar (excludes insurance step from count)
  const isFastTrack = complianceRules?.features?.fast_track_enabled ?? false
  const isRelaxedTrip = ['private_party', 'family', 'fishing_social', 'training'].includes(tripData.tripPurpose)
  const activeSteps = isFastTrack ? FAST_TRACK_STEPS : isRelaxedTrip ? RELAXED_STEPS : STEPS
  const stepIndex = activeSteps.indexOf(state.step === 'insurance' ? 'waiver' : state.step)
  const progressPercent = Math.max(0, (stepIndex / (activeSteps.length - 1)) * 100)

  // Only allow closing from entry/exit steps
  const canClose = state.step === 'code' || state.step === 'boarding'

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(11,30,45,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget && canClose) onClose() }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          width: '100%',
          background: 'var(--color-paper)',
          borderTopLeftRadius: 'var(--r-1)',
          borderTopRightRadius: 'var(--r-1)',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle bar + close + progress */}
        <div className="flex-shrink-0" style={{ paddingTop: 'var(--s-3)', paddingBottom: 'var(--s-2)', paddingLeft: 'var(--s-5)', paddingRight: 'var(--s-5)' }}>
          {/* Drag handle */}
          <div style={{ width: 40, height: 3, background: 'var(--color-line)', borderRadius: 2, margin: '0 auto var(--s-3)' }} />

          <div className="flex items-center justify-between">
            <div className="flex-1" />
            {canClose && (
              <button
                onClick={onClose}
                className="btn btn--ghost btn--sm"
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Progress bar — hidden on boarding step */}
          {state.step !== 'boarding' && (
            <div style={{ marginTop: 'var(--s-3)' }}>
              <div style={{ width: '100%', height: 3, background: 'var(--color-bone)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{ height: '100%', background: 'var(--color-ink)', borderRadius: 2, width: `${progressPercent}%`, transition: 'width 400ms var(--ease)' }}
                />
              </div>
              <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 'var(--s-1)' }}>
                Step {Math.max(1, stepIndex + 1)} of {activeSteps.length}
                {isFastTrack && ' · Fast-Track'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable step content */}
        <div id="join-sheet-content" className="flex-1 overflow-y-auto px-5 pb-8" dir={state.languagePreference === 'ar' ? 'rtl' : 'ltr'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {state.step === 'code' && (
                <StepCode
                  tripSlug={tripSlug}
                  state={state}
                  onUpdate={updateState}
                  onValidated={(_waiverText, waiverHash, firmaTemplateId, safetyCards, lengthFt, boatType, stateCode) => {
                    setValidatedTrip({
                      waiverHash,
                      firmaTemplateId: firmaTemplateId ?? null,
                      safetyCards: (safetyCards ?? []) as GuestSafetyCardData[],
                      lengthFt: lengthFt ?? null,
                      boatType: boatType ?? 'other',
                      stateCode: stateCode ?? 'FL',
                    })
                    goToStep('details')
                  }}
                />
              )}

              {state.step === 'details' && (
                <StepDetails
                  state={state}
                  onUpdate={updateState}
                  onNext={() => goToStep(isFastTrack ? 'waiver' : isRelaxedTrip ? 'waiver' : 'safety')}
                  onBack={() => goToStep('code')}
                  charterType={tripData.charterType}
                  tripSlug={tripSlug}
                  complianceRules={complianceRules}
                  isRelaxedTrip={isRelaxedTrip}
                />
              )}

              {state.step === 'safety' && (
                <StepSafety
                  safetyCards={validatedTrip?.safetyCards ?? []}
                  charterType={tripData.charterType}
                  lengthFt={validatedTrip?.lengthFt ?? null}
                  complianceRules={complianceRules}
                  state={state}
                  onUpdate={updateState}
                  onNext={() => goToStep('waiver')}
                  onBack={() => goToStep('details')}
                />
              )}

              {state.step === 'waiver' && (
                <StepWaiver
                  waiverText=""
                  waiverHash={validatedTrip?.waiverHash ?? ''}
                  firmaTemplateId={validatedTrip?.firmaTemplateId ?? ''}
                  state={state}
                  onUpdate={updateState}
                  tripSlug={tripSlug}
                  isRelaxedTrip={isRelaxedTrip}
                  onNext={(requiresCourse) => {
                    updateState({ requiresCourse })
                    // Beta: always go straight to boarding
                    goToStep('boarding')
                  }}
                  onBack={() => goToStep(isFastTrack || isRelaxedTrip ? 'details' : 'safety')}
                />
              )}

              {/* Insurance and Addons removed for Beta */}

              {state.step === 'boarding' && (
                <StepBoarding
                  tripData={tripData}
                  state={state}
                  tripSlug={tripSlug}
                  onClose={onClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
