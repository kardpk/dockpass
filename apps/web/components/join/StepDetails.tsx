'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
import { cn } from '@/lib/utils/cn'
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_NAMES } from '@/lib/i18n/constants'
import type { JoinFlowState } from '@/types'
import type { ComplianceRules } from '@/lib/compliance/rules'
import { calculateAge } from '@/lib/compliance/rules'

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100),
  phone: z.string().min(7, 'Invalid phone').max(20),
  emergencyContactName: z.string().min(2, 'Required').max(100),
  emergencyContactPhone: z.string().min(7, 'Invalid phone').max(20),
})

const relaxedDetailsSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100),
  phone: z.string().min(7, 'Invalid phone').max(20).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
})

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  flag: LANGUAGE_FLAGS[code],
  name: LANGUAGE_NAMES[code],
}))

interface StepDetailsProps {
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onNext: () => void
  onBack: () => void
  charterType: 'captained' | 'bareboat' | 'both'
  tripSlug: string
  complianceRules?: ComplianceRules | null
  isRelaxedTrip?: boolean
}

/**
 * Florida FWC Chapter 327: Boat operators born on or after Jan 1, 1988
 * must hold an FWC-approved Boater Safety ID for bareboat/livery charters.
 */
function requiresFwcLicense(dob: string, charterType: string): boolean {
  if (charterType === 'captained') return false
  if (!dob) return false
  return new Date(dob) >= new Date('1988-01-01')
}

export function StepDetails({ state, onUpdate, onNext, onBack, charterType, tripSlug, complianceRules, isRelaxedTrip = false }: StepDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showOptional, setShowOptional] = useState(false)

  const isBareboat = charterType === 'bareboat' || charterType === 'both'
  const fwcRequired = useMemo(
    () => requiresFwcLicense(state.dateOfBirth, charterType),
    [state.dateOfBirth, charterType]
  )

  // California Hard Age-Gate: block underage PWC operators
  const isUnderage = useMemo(() => {
    const minAge = complianceRules?.age_gates?.min_driver_age
    if (!state.dateOfBirth || !minAge) return false
    return calculateAge(state.dateOfBirth) < minAge
  }, [state.dateOfBirth, complianceRules])

  // Block continue if FWC license required but not uploaded, OR underage age-gate triggered
  const canContinue = (!fwcRequired || !!state.fwcLicenseUrl) && !isUnderage

  const handleFwcUpload = useCallback(async (file: File) => {
    if (state.fwcLicenseUploading) return
    onUpdate({ fwcLicenseUploading: true })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/trips/${tripSlug}/upload-fwc`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        setErrors(prev => ({ ...prev, fwcLicense: err.error }))
        return
      }

      const { data } = await res.json()
      onUpdate({ fwcLicenseUrl: data.url })
      setErrors(prev => {
        const next = { ...prev }
        delete next.fwcLicense
        return next
      })
    } catch {
      setErrors(prev => ({ ...prev, fwcLicense: 'Upload failed. Please try again.' }))
    } finally {
      onUpdate({ fwcLicenseUploading: false })
    }
  }, [state.fwcLicenseUploading, tripSlug, onUpdate])

  function handleNext() {
    const schema = isRelaxedTrip ? relaxedDetailsSchema : detailsSchema
    const result = schema.safeParse({
      fullName: state.fullName,
      phone: state.phone || undefined,
      emergencyContactName: state.emergencyContactName || undefined,
      emergencyContactPhone: state.emergencyContactPhone || undefined,
    })

    const fieldErrors: Record<string, string> = {}

    if (!result.success) {
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        fieldErrors[field] = msgs[0] ?? 'Invalid'
      }
    }

    // Bareboat: DOB is required
    if (isBareboat && !state.dateOfBirth) {
      fieldErrors.dateOfBirth = 'Date of birth is required for bareboat charters'
    }

    // FWC license required but not uploaded
    if (fwcRequired && !state.fwcLicenseUrl) {
      fieldErrors.fwcLicense = 'FWC Boater Safety ID is required'
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    onNext()
  }

  return (
    <div className="pt-2 space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-text-mid -ml-1 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div>
        <h2 className="text-[20px] font-bold text-navy mb-1">Your details</h2>
        <p className="text-[14px] text-text-mid">
          {isRelaxedTrip ? 'For a safe day on the water' : 'Required for safety at sea'}
        </p>
        {isRelaxedTrip && (
          <p className="text-[12px] text-navy mt-1 bg-gold-dim px-3 py-1.5 rounded-lg inline-block">
            This is a private trip — only your name is required
          </p>
        )}
      </div>

      {/* Full name */}
      <FormField label="Full name" required error={errors.fullName}>
        <input
          type="text"
          autoComplete="name"
          placeholder="Sofia Martinez"
          value={state.fullName}
          onChange={e => onUpdate({ fullName: e.target.value })}
          className={inputClass(!!errors.fullName)}
        />
      </FormField>

      {/* Your phone number */}
      <FormField label="Your phone number" required={!isRelaxedTrip} helper="For dock reminders and alerts" error={errors.phone}>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+1 305 555 0100"
          value={state.phone}
          onChange={e => onUpdate({ phone: e.target.value })}
          className={inputClass(!!errors.phone)}
        />
      </FormField>

      {/* Emergency contact name */}
      <FormField
        label="Emergency contact name"
        required={!isRelaxedTrip}
        helper={isRelaxedTrip ? 'recommended but optional' : 'Someone not on the boat'}
        error={errors.emergencyContactName}
      >
        <input
          type="text"
          autoComplete="off"
          placeholder="Maria Martinez"
          value={state.emergencyContactName}
          onChange={e => onUpdate({ emergencyContactName: e.target.value })}
          className={inputClass(!!errors.emergencyContactName)}
        />
      </FormField>

      {/* Emergency contact phone */}
      <FormField
        label="Emergency contact phone"
        required={!isRelaxedTrip}
        error={errors.emergencyContactPhone}
      >
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+1 305 555 0100"
          value={state.emergencyContactPhone}
          onChange={e => onUpdate({ emergencyContactPhone: e.target.value })}
          className={inputClass(!!errors.emergencyContactPhone)}
        />
      </FormField>

      {/* Warning if emergency contact matches own phone */}
      {state.phone && state.emergencyContactPhone && 
       state.phone.replace(/\D/g, '').slice(-10) === state.emergencyContactPhone.replace(/\D/g, '').slice(-10) && (
        <div className="mt-2 text-[12.5px] text-warn p-2 bg-[#FFF8E1] border border-[#FFD54F] rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <span>
            This looks like your own number. Emergency contacts should be someone not on the boat.
          </span>
        </div>
      )}

      {/* ── Bareboat: DOB is REQUIRED (shown above optional toggle) ── */}
      {isBareboat && (
        <div className="space-y-4">
          <FormField
            label="Date of birth"
            required
            helper="Required for bareboat charter (FWC compliance)"
            error={errors.dateOfBirth}
          >
            <input
              type="date"
              value={state.dateOfBirth}
              onChange={e => onUpdate({ dateOfBirth: e.target.value })}
              className={inputClass(!!errors.dateOfBirth)}
            />
          </FormField>

          {/* ── California Hard Age-Gate (animated reveal) ── */}
          <AnimatePresence>
            {isUnderage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="mt-4 p-4 bg-error-dim border-2 border-error rounded-[14px] space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-error flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-[14px] font-bold text-error">
                        COMPLIANCE BLOCK
                      </p>
                      <p className="text-[13px] text-[#7F1D1D] leading-relaxed mt-1">
                        State law requires the primary operator to be at least{' '}
                        <strong>{complianceRules?.age_gates?.min_driver_age}</strong> years old
                        for this vessel type. You cannot proceed with this booking.
                      </p>
                      <p className="text-[12px] text-[#991B1B] mt-2 font-medium">
                        CA Harbors &amp; Navigation Code — Motorized vessel age restriction
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FWC License Upload Gate (animated reveal) ── */}
          <AnimatePresence>
            {fwcRequired && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="p-4 bg-[#FFF8E1] border border-[#FFD54F] rounded-[14px] space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[14px] font-semibold text-warn">
                        FWC Boater Safety ID Required
                      </p>
                      <p className="text-[13px] text-warn/80 mt-1 leading-relaxed">
                        Florida law (Chapter 327) requires boaters born on or after
                        January 1, 1988 to hold an approved Boating Safety Education ID
                        to operate a vessel.
                      </p>
                    </div>
                  </div>

                  {state.fwcLicenseUrl ? (
                    /* ── Upload Success ── */
                    <div className="flex items-center gap-3 p-3 bg-teal-dim border border-teal rounded-[10px]">
                      <CheckCircle size={20} className="text-teal flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-teal">
                          FWC Boater Safety ID uploaded
                        </p>
                        <p className="text-[12px] text-text-mid truncate">
                          Will be verified by marina staff on arrival
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdate({ fwcLicenseUrl: null })}
                        className="text-[12px] text-text-mid underline"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    /* ── Upload Input ── */
                    <div className="space-y-2">
                      <label
                        className={cn(
                          'flex items-center justify-center gap-2 w-full h-[52px] rounded-[10px] border-2 border-dashed cursor-pointer transition-all',
                          state.fwcLicenseUploading
                            ? 'border-[#FFD54F] bg-[#FFF8E1] cursor-wait'
                            : 'border-[#F59E0B] bg-white hover:bg-[#FFFBEB]'
                        )}
                      >
                        {state.fwcLicenseUploading ? (
                          <>
                            <Loader2 size={18} className="animate-spin text-[#F59E0B]" />
                            <span className="text-[14px] font-medium text-warn">Uploading…</span>
                          </>
                        ) : (
                          <>
                            <Upload size={18} className="text-[#F59E0B]" />
                            <span className="text-[14px] font-medium text-warn">
                              Upload photo of your card
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic"
                          className="hidden"
                          disabled={state.fwcLicenseUploading}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleFwcUpload(file)
                          }}
                        />
                      </label>

                      {errors.fwcLicense && (
                        <p className="text-[12px] text-error">{errors.fwcLicense}</p>
                      )}

                      <p className="text-[12px] text-warn/70 text-center">
                        No card?{' '}
                        <a
                          href="https://myfwc.com/boating/safety-education/courses/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-navy underline"
                        >
                          Complete the free FWC course →
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Optional info toggle */}
      <button
        type="button"
        onClick={() => setShowOptional(o => !o)}
        className="text-[13px] text-navy font-medium underline min-h-[44px]"
      >
        {showOptional ? '− Hide optional info' : '+ Add optional info'}
      </button>

      {showOptional && (
        <div className="space-y-5">
          {/* Dietary requirements */}
          <FormField label="Dietary requirements" helper="optional">
            <input
              type="text"
              placeholder="Nut allergy, vegan, etc."
              value={state.dietaryRequirements}
              onChange={e => onUpdate({ dietaryRequirements: e.target.value })}
              className={inputClass(false)}
            />
          </FormField>

          {/* Date of birth — only show here if NOT bareboat (already shown above) */}
          {!isBareboat && (
            <FormField label="Date of birth" helper="optional, for course requirements">
              <input
                type="date"
                value={state.dateOfBirth}
                onChange={e => onUpdate({ dateOfBirth: e.target.value })}
                className={inputClass(false)}
              />
            </FormField>
          )}

          {/* Language preference */}
          <FormField label="Preferred language">
            <select
              value={state.languagePreference}
              onChange={e => onUpdate({ languagePreference: e.target.value })}
              className={inputClass(false)}
            >
              {LANGUAGE_OPTIONS.map(l => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </FormField>

          {/* Flags */}
          <div className="space-y-3">
            {[
              { key: 'isNonSwimmer' as const, icon: 'swim', label: "I'm a non-swimmer" },
              { key: 'isSeaSicknessProne' as const, icon: 'wave', label: 'I get seasick easily' },
            ].map(flag => (
              <label key={flag.key} className="flex items-center gap-3 min-h-[48px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state[flag.key]}
                  onChange={e => onUpdate({ [flag.key]: e.target.checked })}
                  className="w-5 h-5 rounded accent-gold"
                />
                <span className="text-[14px] text-navy">
                  {flag.icon} {flag.label}
                </span>
              </label>
            ))}
          </div>

          {/* GDPR (EU only) */}
          {state.isEU && (
            <div className="p-4 bg-bg rounded-[12px] space-y-3">
              <p className="text-[12px] font-semibold text-text-mid uppercase tracking-wider">
                Data consent (EU)
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={state.gdprConsent}
                  onChange={e => onUpdate({ gdprConsent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded accent-gold flex-shrink-0"
                />
                <span className="text-[13px] text-navy leading-relaxed">
                  I consent to BoatCheckin processing my personal data for this charter trip as
                  described in the{' '}
                  <a href="/privacy" className="text-navy underline" target="_blank">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.marketingConsent}
                  onChange={e => onUpdate({ marketingConsent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded accent-gold flex-shrink-0"
                />
                <span className="text-[13px] text-text-mid">
                  I agree to receive occasional offers from this operator.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!canContinue && fwcRequired}
        className={cn(
          'w-full h-[56px] rounded-[12px] font-semibold text-[16px] transition-all active:scale-[0.98]',
          !canContinue && fwcRequired
            ? 'bg-border text-text-mid cursor-not-allowed'
            : 'bg-gold text-white hover:bg-gold-hi'
        )}
      >
        Continue →
      </button>
    </div>
  )
}

function FormField({
  label, required, helper, error, children,
}: {
  label: string
  required?: boolean
  helper?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-mid mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
        {helper && <span className="font-normal ml-1 text-text-mid">— {helper}</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full h-[52px] px-4 rounded-[10px] text-[15px]',
    'border bg-white text-navy',
    'placeholder:text-text-mid',
    'focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold',
    hasError ? 'border-[#D63B3B] bg-error-dim' : 'border-border'
  )
}
