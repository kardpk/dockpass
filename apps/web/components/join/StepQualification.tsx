'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, Upload, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import type { JoinFlowState } from '@/types'

// ─── Vessel type options ─────────────────────────────────────────────────────

const VESSEL_TYPES = [
  { value: 'center_console', label: 'Center Console' },
  { value: 'pontoon',        label: 'Pontoon' },
  { value: 'sailboat',       label: 'Sailboat' },
  { value: 'other',          label: 'Other' },
] as const

type VesselType = typeof VESSEL_TYPES[number]['value']

// ─── Props ───────────────────────────────────────────────────────────────────

interface StepQualificationProps {
  state: JoinFlowState
  onUpdate: (partial: Partial<JoinFlowState>) => void
  onNext: (qualificationId: string) => void
  onBack: () => void
  tripSlug: string
  requiresBoaterCard: boolean
  minExperienceYears: number
  requiresBoatOwnership: boolean
  qualificationNotes: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StepQualification({
  state,
  onUpdate,
  onNext,
  onBack,
  tripSlug,
  requiresBoaterCard,
  minExperienceYears,
  requiresBoatOwnership,
  qualificationNotes,
}: StepQualificationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (requiresBoatOwnership && state.hasBoatOwnership === undefined) {
      errs.ownership = 'Please indicate your ownership experience'
    }

    const expYears = parseInt(state.experienceYears || '0', 10)
    if (isNaN(expYears) || expYears < 0) {
      errs.experienceYears = 'Please enter a valid number of years'
    }
    if (minExperienceYears > 0 && expYears < minExperienceYears) {
      errs.experienceYears = `This rental requires at least ${minExperienceYears} years of experience`
    }

    if (requiresBoaterCard && !state.safetyBoaterCardUrl) {
      errs.boaterCard = 'Please upload your Safe Boater Education Card'
    }

    if (!state.qualificationAttested) {
      errs.attestation = 'Please confirm the attestation above'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Safe Boater Card upload ───────────────────────────────────────────────

  const handleCardUpload = useCallback(async (file: File) => {
    onUpdate({ safetyBoaterCardUploading: true })
    setErrors(prev => ({ ...prev, boaterCard: '' }))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/trips/${tripSlug}/upload-boater-card`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onUpdate({ safetyBoaterCardUrl: json.data.url, safetyBoaterCardUploading: false })
    } catch (err) {
      onUpdate({ safetyBoaterCardUploading: false })
      setErrors(prev => ({
        ...prev,
        boaterCard: err instanceof Error ? err.message : 'Upload failed. Please try again.',
      }))
    }
  }, [tripSlug, onUpdate])

  // ── Submit qualification ──────────────────────────────────────────────────

  async function handleNext() {
    if (!validate()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/trips/${tripSlug}/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripSlug,
          hasBoatOwnership:      state.hasBoatOwnership ?? false,
          ownershipYears:        state.hasBoatOwnership ? parseInt(state.ownershipYears || '0', 10) : null,
          ownershipVesselType:   state.hasBoatOwnership ? (state.ownershipVesselType || null) : null,
          experienceYears:       parseInt(state.experienceYears || '0', 10),
          experienceDescription: state.experienceDescription || null,
          safetyBoaterRequired:  state.safetyBoaterRequired,
          safetyBoaterCardUrl:   state.safetyBoaterCardUrl ?? null,
          safetyBoaterCardState: state.safetyBoaterCardState || null,
          safetyBoaterCardNumber: state.safetyBoaterCardNumber || null,
          attestation:           true,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      onUpdate({ qualificationId: json.data.qualificationId })
      onNext(json.data.qualificationId)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingTop: 'var(--s-4)', paddingBottom: 'var(--s-8)' }}>

      {/* Header */}
      <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-1)' }}>
        Self-Drive Verification
      </p>
      <h2 style={{ fontSize: 'var(--t-heading-md)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
        Before you get the keys
      </h2>
      <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-6)', lineHeight: 1.5 }}>
        Florida law and this operator require verification of your boating experience
        before renting this vessel.
      </p>

      {/* Operator notes (if any) */}
      {qualificationNotes && (
        <div
          style={{
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-1)',
            background: 'var(--color-bone)',
            border: '1px solid var(--color-line-soft)',
            marginBottom: 'var(--s-6)',
          }}
        >
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
            {qualificationNotes}
          </p>
        </div>
      )}

      {/* ── SECTION A: Experience ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 'var(--s-6)' }}>
        <p className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: 'var(--s-3)' }}>
          A — Boating Experience
        </p>

        {/* Ownership */}
        <div style={{ marginBottom: 'var(--s-4)' }}>
          <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
            Have you owned a boat?
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => onUpdate({ hasBoatOwnership: val })}
                style={{
                  flex: 1,
                  padding: 'var(--s-3)',
                  borderRadius: 'var(--r-1)',
                  fontSize: 'var(--t-body-sm)',
                  fontWeight: 600,
                  border: '2px solid',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  background: state.hasBoatOwnership === val ? 'var(--color-ink)' : 'var(--color-paper)',
                  color:      state.hasBoatOwnership === val ? 'var(--color-paper)' : 'var(--color-ink)',
                  borderColor: state.hasBoatOwnership === val ? 'var(--color-ink)' : 'var(--color-line)',
                }}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
          {errors.ownership && (
            <p style={{ fontSize: 12, color: 'var(--color-status-err)', marginTop: 'var(--s-1)' }}>{errors.ownership}</p>
          )}
        </div>

        {/* Ownership details — conditional */}
        {state.hasBoatOwnership && (
          <div style={{ marginBottom: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            {/* Vessel type */}
            <div>
              <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
                What type of boat?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
                {VESSEL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onUpdate({ ownershipVesselType: t.value })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 500,
                      border: '1.5px solid',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      background:   state.ownershipVesselType === t.value ? 'var(--color-ink)' : 'var(--color-paper)',
                      color:        state.ownershipVesselType === t.value ? 'var(--color-paper)' : 'var(--color-ink)',
                      borderColor:  state.ownershipVesselType === t.value ? 'var(--color-ink)' : 'var(--color-line)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ownership years */}
            <div>
              <label style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 'var(--s-1)' }}>
                How many years did you own it?
              </label>
              <input
                type="number"
                min="0"
                max="80"
                value={state.ownershipYears}
                onChange={(e) => onUpdate({ ownershipYears: e.target.value })}
                placeholder="0"
                className="input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Experience years */}
        <div style={{ marginBottom: 'var(--s-3)' }}>
          <label style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 'var(--s-1)' }}>
            How many years of active boating experience do you have?
            {minExperienceYears > 0 && (
              <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 4 }}>
                (minimum {minExperienceYears} required)
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            max="80"
            value={state.experienceYears}
            onChange={(e) => onUpdate({ experienceYears: e.target.value })}
            placeholder="0"
            className="input"
            style={{ width: '100%' }}
          />
          {errors.experienceYears && (
            <p style={{ fontSize: 12, color: 'var(--color-status-err)', marginTop: 'var(--s-1)' }}>{errors.experienceYears}</p>
          )}
        </div>

        {/* Description — optional */}
        <div>
          <label style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 'var(--s-1)' }}>
            Briefly describe your experience
            <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 4 }}>(optional)</span>
          </label>
          <textarea
            value={state.experienceDescription}
            onChange={(e) => onUpdate({ experienceDescription: e.target.value })}
            placeholder="Types of boats operated, waters navigated, typical usage..."
            maxLength={500}
            rows={3}
            className="input"
            style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* ── SECTION B: Safe Boater Card ──────────────────────────────────── */}
      {requiresBoaterCard && (
        <div style={{ marginBottom: 'var(--s-6)' }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: 'var(--s-3)' }}>
            B — Safe Boater Card
          </p>
          <div
            style={{
              padding: 'var(--s-3) var(--s-4)',
              borderRadius: 'var(--r-1)',
              background: 'rgba(var(--color-brass-rgb, 181,150,89), 0.06)',
              border: '1px solid rgba(181,150,89,0.25)',
              marginBottom: 'var(--s-4)',
            }}
          >
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: 0 }}>
              Florida law (F.S. §327.54) requires a Safe Boater Education Card for anyone
              born after January 1, 1988. Please upload a photo of your card.
            </p>
          </div>

          {/* Upload area */}
          {!state.safetyBoaterCardUrl ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--s-2)',
                padding: 'var(--s-6)',
                borderRadius: 'var(--r-1)',
                border: '2px dashed var(--color-line)',
                cursor: 'pointer',
                background: 'var(--color-bone)',
                transition: 'border-color 150ms',
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCardUpload(file)
                }}
              />
              {state.safetyBoaterCardUploading ? (
                <Loader2 size={24} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload size={24} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} />
              )}
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
                {state.safetyBoaterCardUploading ? 'Uploading…' : 'Tap to upload card photo'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                JPEG, PNG, WebP, HEIC or PDF · Max 5 MB
              </span>
            </label>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-3)',
                padding: 'var(--s-3) var(--s-4)',
                borderRadius: 'var(--r-1)',
                background: 'rgba(31,107,82,0.06)',
                border: '1px solid rgba(31,107,82,0.2)',
              }}
            >
              <CheckCircle size={18} style={{ color: 'var(--color-status-ok)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-status-ok)', margin: 0 }}>
                  Card uploaded
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: 0 }}>
                  Your Safe Boater Card has been received
                </p>
              </div>
              <button
                onClick={() => onUpdate({ safetyBoaterCardUrl: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-ink-muted)' }}
                aria-label="Remove uploaded card"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {errors.boaterCard && (
            <p style={{ fontSize: 12, color: 'var(--color-status-err)', marginTop: 'var(--s-1)' }}>{errors.boaterCard}</p>
          )}

          {/* Optional: card number + state */}
          <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-muted)', display: 'block', marginBottom: 4 }}>
                Card number (optional)
              </label>
              <input
                type="text"
                value={state.safetyBoaterCardNumber}
                onChange={(e) => onUpdate({ safetyBoaterCardNumber: e.target.value })}
                placeholder="FL-XXXXXX"
                className="input"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ width: 90 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink-muted)', display: 'block', marginBottom: 4 }}>
                State
              </label>
              <input
                type="text"
                maxLength={2}
                value={state.safetyBoaterCardState}
                onChange={(e) => onUpdate({ safetyBoaterCardState: e.target.value.toUpperCase() })}
                placeholder="FL"
                className="input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION C: Attestation ────────────────────────────────────────── */}
      <div style={{ marginBottom: 'var(--s-6)' }}>
        <p className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: 'var(--s-3)' }}>
          C — Attestation
        </p>
        <label
          style={{
            display: 'flex',
            gap: 'var(--s-3)',
            alignItems: 'flex-start',
            cursor: 'pointer',
            padding: 'var(--s-4)',
            borderRadius: 'var(--r-1)',
            border: `2px solid ${state.qualificationAttested ? 'var(--color-ink)' : 'var(--color-line)'}`,
            background: state.qualificationAttested ? 'var(--color-bone)' : 'var(--color-paper)',
            transition: 'all 200ms',
          }}
        >
          <input
            type="checkbox"
            checked={state.qualificationAttested}
            onChange={(e) => onUpdate({ qualificationAttested: e.target.checked })}
            style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--color-ink)' }}
          />
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.5, margin: 0 }}>
            I confirm that the information provided above is accurate and complete.
            I understand that misrepresentation of my boating experience or credentials
            may result in refusal of rental without refund, and may void any applicable
            liability protections.
          </p>
        </label>
        {errors.attestation && (
          <p style={{ fontSize: 12, color: 'var(--color-status-err)', marginTop: 'var(--s-1)' }}>{errors.attestation}</p>
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--s-2)',
            alignItems: 'flex-start',
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-1)',
            background: 'rgba(180,60,60,0.06)',
            border: '1px solid rgba(180,60,60,0.2)',
            marginBottom: 'var(--s-4)',
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--color-status-err)', marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-status-err)', margin: 0 }}>{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
        <button
          onClick={onBack}
          className="btn btn--ghost"
          style={{ flexShrink: 0 }}
          aria-label="Go back"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting || state.safetyBoaterCardUploading}
          className="btn btn--primary"
          style={{ flex: 1 }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
              Saving…
            </>
          ) : (
            'Continue to Safety →'
          )}
        </button>
      </div>
    </div>
  )
}
