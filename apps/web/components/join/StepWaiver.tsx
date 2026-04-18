'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createSignatureRequest } from '@/app/actions/firma'
import { ChevronLeft } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState } from '@/types'

interface StepWaiverProps {
  waiverText: string
  waiverHash: string
  firmaTemplateId?: string
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  tripSlug: string
  onNext: (requiresCourse: boolean) => void
  onBack: () => void
  isRelaxedTrip?: boolean
}

export function StepWaiver({
  waiverText, waiverHash, firmaTemplateId, state, onUpdate,
  tripSlug, onNext, onBack, isRelaxedTrip = false,
}: StepWaiverProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null)
  const [firmaLoading, setFirmaLoading] = useState(false)

  // ── STALE CLOSURE FIX ──────────────────────────────────────────────────────
  // Mirror state to a ref so the Firma postMessage listener always reads fresh values.
  // Without this, the iframe completion event captures a stale closure and sends
  // outdated guest data (old name, missing Turnstile token, etc.) to the registration API.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // ── Scroll handling (legacy mode only) ─────────────────────────────────────
  // Auto-mark as scrolled if the waiver text fits without scrolling
  useEffect(() => {
    if (!firmaTemplateId && scrollRef.current) {
      const el = scrollRef.current
      if (el.scrollHeight <= el.clientHeight + 5) {
        onUpdate({ waiverScrolled: true })
      }
    }
  }, [firmaTemplateId, onUpdate])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const progress = el.scrollTop / Math.max(el.scrollHeight - el.clientHeight, 1)
    setScrollProgress(Math.min(progress, 1))
    if (progress >= 0.98) {
      onUpdate({ waiverScrolled: true })
    }
  }

  // ── Registration request ───────────────────────────────────────────────────
  // Accepts an explicit state snapshot for Firma auto-sign (ref-based).
  // Falls back to the component state for manual sign.
  const handleSign = useCallback(async (stateSnapshot?: JoinFlowState) => {
    const s = stateSnapshot ?? state
    onUpdate({ isSubmitting: true, submitError: '' })

    try {
      const res = await fetch(`/api/trips/${tripSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripSlug,
          tripCode: s.tripCode,
          fullName: s.fullName,
          emergencyContactName: s.emergencyContactName,
          emergencyContactPhone: s.emergencyContactPhone,
          dietaryRequirements: s.dietaryRequirements || undefined,
          languagePreference: s.languagePreference,
          dateOfBirth: s.dateOfBirth || undefined,
          isNonSwimmer: s.isNonSwimmer,
          isSeaSicknessProne: s.isSeaSicknessProne,
          gdprConsent: s.gdprConsent,
          marketingConsent: s.marketingConsent,
          safetyAcknowledgments: s.safetyAcks,
          waiverSignatureText: s.signatureText.trim() || 'Digital E-Signature',
          waiverAgreed: true,
          // Firma-signed waivers use the literal marker; legacy uses the SHA-256 hash
          waiverTextHash: firmaTemplateId ? 'firma_template' : waiverHash,
          turnstileToken: s.turnstileToken,
          fwcLicenseUrl: s.fwcLicenseUrl ?? null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        onUpdate({ isSubmitting: false, submitError: json.error ?? 'Registration failed' })
        return
      }

      const { guestId, qrToken, requiresCourse, approvalStatus } = json.data

      try {
        const { storage } = await import('@/lib/storage')
        storage.set('guest_session', {
          guestId,
          tripSlug,
          qrToken,
          guestName: s.fullName,
          checkedInAt: new Date().toISOString(),
          addonOrderIds: [],
        }, tripSlug)
      } catch { /* Private mode ignore */ }

      onUpdate({ isSubmitting: false, guestId, qrToken, requiresCourse, approvalStatus: approvalStatus ?? null, waiverTextHash: waiverHash })
      onNext(requiresCourse)
    } catch {
      onUpdate({ isSubmitting: false, submitError: 'Connection error. Please try again.' })
    }
  }, [tripSlug, firmaTemplateId, waiverHash, state, onUpdate, onNext])

  // ── Pre-load Firma signing session ─────────────────────────────────────────
  // Uses the per-boat templateId (not a global env var) for multi-tenancy
  useEffect(() => {
    if (firmaTemplateId && !firmaUrl && !firmaLoading) {
      setFirmaLoading(true)
      createSignatureRequest(
        tripSlug,
        state.fullName,
        firmaTemplateId,
        {
          firstName: state.fullName.split(' ')[0] || 'Guest',
          lastName: state.fullName.split(' ').slice(1).join(' '),
          email: '', // Email not collected in basic Join flow
        }
      )
      .then(res => {
        if (res.success && res.data?.embed_url) {
          setFirmaUrl(res.data.embed_url)
        }
      })
      .catch(e => console.error("Firma load error", e))
      .finally(() => setFirmaLoading(false))
    }
  }, [firmaTemplateId, firmaUrl, firmaLoading, tripSlug, state.fullName])

  // ── Firma completion listener (defense-in-depth origin validation) ─────────
  // Uses dynamic origin extraction from the trusted Firma embed URL
  // instead of hardcoding a domain we don't control.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 1. Dynamic origin validation — only trust the domain Firma gave us
      if (firmaUrl) {
        try {
          const trustedOrigin = new URL(firmaUrl).origin
          if (event.origin !== trustedOrigin) {
            console.warn(`[Security] Blocked unauthorized postMessage from: ${event.origin}`)
            return
          }
        } catch {
          console.error('[Security] Failed to parse Firma URL for origin validation')
          return
        }
      }

      // 2. Process the valid Firma completion event
      if (event.data?.event === 'document.completed' || event.data === 'document.completed') {
        // Read FRESH state from ref — bypasses the stale closure problem
        const fresh = stateRef.current
        // Merge the Firma auto-sign fields into the snapshot
        // (onUpdate hasn't flushed yet because React batches state updates)
        const snapshot: JoinFlowState = {
          ...fresh,
          waiverAgreed: true,
          signatureText: 'Digital E-Signature',
          waiverScrolled: true,
        }
        onUpdate({ waiverAgreed: true, signatureText: 'Digital E-Signature', waiverScrolled: true })
        handleSign(snapshot)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
    // stateRef and firmaUrl are the only external values read inside the handler.
    // stateRef identity never changes; firmaUrl changes once when loaded.
  }, [firmaUrl, onUpdate, handleSign])

  // ── Manual sign handler ────────────────────────────────────────────────────
  const handleManualSign = () => {
    if (!state.waiverAgreed || !state.signatureText.trim() || !state.waiverScrolled) return
    handleSign()
  }

  const canSign = state.waiverScrolled && state.waiverAgreed && state.signatureText.trim().length >= 2

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        disabled={state.isSubmitting}
        className="flex items-center gap-1 text-[13px] text-text-mid -ml-1 mb-4 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="text-[20px] font-bold text-navy mb-1">
        {isRelaxedTrip ? 'Acknowledgment' : 'Sign the liability waiver'}
      </h2>
      <p className="text-[14px] text-text-mid mb-4">
        {isRelaxedTrip ? 'A quick note for your safety' : 'Please read carefully before signing'}
      </p>

      {/* Skip button for private/family trips */}
      {isRelaxedTrip && !firmaTemplateId && (
        <button
          type="button"
          onClick={() => {
            onUpdate({
              waiverAgreed: true,
              waiverScrolled: true,
              signatureText: 'Skipped — Private Trip',
            })
            handleSign({
              ...state,
              waiverAgreed: true,
              waiverScrolled: true,
              signatureText: 'Skipped — Private Trip',
            })
          }}
          disabled={state.isSubmitting}
          className="w-full mb-4 py-3 px-4 rounded-[12px] border border-border bg-bg text-[14px] text-navy font-medium hover:bg-gold-dim transition-colors"
        >
          Skip waiver — this is a private trip
        </button>
      )}

      {/* Embedded Firma Editor */}
      {firmaTemplateId ? (
        <div className="w-full h-[400px] bg-bg border border-border rounded-[14px] overflow-hidden flex flex-col items-center justify-center relative">
           {firmaLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                 <AnchorLoader size="md" color="navy" />
                 <p className="text-[12px] text-text-mid">Securing document...</p>
             </div>
           )}
           {firmaUrl && (
             <iframe 
               src={firmaUrl}
               className="w-full h-full z-10"
               frameBorder="0"
               title="Digital waiver signing"
             />
           )}
           {!firmaLoading && !firmaUrl && (
              <p className="text-[13px] text-error">Failed to load digital waiver. Please see Captain.</p>
           )}
        </div>
      ) : (
        <>
          {/* Scroll progress bar (Only for non-Firma legacy mode) */}
          <div className="w-full h-1 bg-gold-dim rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-navy rounded-full transition-all"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          {!state.waiverScrolled && (
            <p className="text-[12px] text-text-mid mb-3 text-center">
              ↓ Scroll to read the full waiver
            </p>
          )}

          {/* Waiver text — scrollable box */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-56 overflow-y-auto rounded-[12px] border border-border bg-bg p-4 mb-4 text-[13px] text-navy leading-relaxed whitespace-pre-wrap"
            tabIndex={0}
            role="region"
            aria-label="Waiver text"
          >
            {waiverText || `By participating in this charter, you acknowledge and accept all risks associated with boating activities. You agree to follow all safety instructions from the captain and crew. BoatCheckin and the boat operator are not liable for personal injury, loss, or damage arising from participation in this trip.`}
          </div>

          {/* Agree checkbox */}
          <label className="flex items-start gap-3 mb-5 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={state.waiverAgreed}
              onChange={e => onUpdate({ waiverAgreed: e.target.checked })}
              disabled={!state.waiverScrolled}
              className="w-5 h-5 mt-0.5 rounded accent-gold flex-shrink-0"
            />
            <span className={cn('text-[14px] leading-relaxed', state.waiverScrolled ? 'text-navy' : 'text-text-mid')}>
              I have read and agree to the liability waiver
            </span>
          </label>

          {/* Signature field — Satisfy cursive font */}
          <div className="mb-5">
            <label className="block text-[13px] font-medium text-text-mid mb-2">
              Type your full name as your signature
            </label>
            <input
              type="text"
              placeholder="Sofia Martinez"
              value={state.signatureText}
              onChange={e => onUpdate({ signatureText: e.target.value })}
              disabled={!state.waiverAgreed || state.isSubmitting}
              style={{ fontFamily: 'var(--font-satisfy, cursive)', fontSize: '22px', color: 'var(--color-navy)' }}
              className="w-full h-[56px] px-4 rounded-[10px] border border-border placeholder:text-text-dim focus:outline-none focus:border-gold disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-text-mid mt-1">
              By typing your name, you agree this constitutes your legal signature
            </p>
          </div>
        </>
      )}

      {/* Error */}
      {state.submitError && (
        <div className="p-4 rounded-[12px] bg-error-dim mb-4">
          <p className="text-[14px] text-error font-medium">{state.submitError}</p>
        </div>
      )}

      {/* Sign button (Only for non-Firma) */}
      {!firmaTemplateId && (
        <button
          onClick={handleManualSign}
          disabled={!canSign || state.isSubmitting}
        className={cn(
          'w-full h-[56px] rounded-[12px]',
          'font-semibold text-[16px]',
          'flex items-center justify-center gap-2',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-gold text-white hover:bg-gold-hi'
        )}
      >
        {state.isSubmitting ? <AnchorLoader size="sm" color="white" /> : '✓ Sign and check in'}
        </button>
      )}
    </div>
  )
}
