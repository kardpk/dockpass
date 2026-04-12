'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { z } from 'zod'
import { cn } from '@/lib/utils/cn'
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_NAMES } from '@/lib/i18n/constants'
import type { JoinFlowState } from '@/types'

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100),
  emergencyContactName: z.string().min(2, 'Required').max(100),
  emergencyContactPhone: z.string().min(7, 'Invalid phone').max(20),
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
}

export function StepDetails({ state, onUpdate, onNext, onBack }: StepDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showOptional, setShowOptional] = useState(false)

  function handleNext() {
    const result = detailsSchema.safeParse({
      fullName: state.fullName,
      emergencyContactName: state.emergencyContactName,
      emergencyContactPhone: state.emergencyContactPhone,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        fieldErrors[field] = msgs[0] ?? 'Invalid'
      }
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
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">Your details</h2>
        <p className="text-[14px] text-[#6B7C93]">Required for safety at sea</p>
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

      {/* Emergency contact name */}
      <FormField
        label="Emergency contact name"
        required
        helper="Someone not on the boat"
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
        required
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

      {/* Optional info toggle */}
      <button
        type="button"
        onClick={() => setShowOptional(o => !o)}
        className="text-[13px] text-[#0C447C] font-medium underline min-h-[44px]"
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

          {/* Date of birth */}
          <FormField label="Date of birth" helper="optional, for course requirements">
            <input
              type="date"
              value={state.dateOfBirth}
              onChange={e => onUpdate({ dateOfBirth: e.target.value })}
              className={inputClass(false)}
            />
          </FormField>

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
              { key: 'isNonSwimmer' as const, icon: '🏊', label: "I'm a non-swimmer" },
              { key: 'isSeaSicknessProne' as const, icon: '🌊', label: 'I get seasick easily' },
            ].map(flag => (
              <label key={flag.key} className="flex items-center gap-3 min-h-[48px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state[flag.key]}
                  onChange={e => onUpdate({ [flag.key]: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#0C447C]"
                />
                <span className="text-[14px] text-[#0D1B2A]">
                  {flag.icon} {flag.label}
                </span>
              </label>
            ))}
          </div>

          {/* GDPR (EU only) */}
          {state.isEU && (
            <div className="p-4 bg-[#F5F8FC] rounded-[12px] space-y-3">
              <p className="text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider">
                Data consent (EU)
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={state.gdprConsent}
                  onChange={e => onUpdate({ gdprConsent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
                />
                <span className="text-[13px] text-[#0D1B2A] leading-relaxed">
                  I consent to BoatCheckin processing my personal data for this charter trip as
                  described in the{' '}
                  <a href="/privacy" className="text-[#0C447C] underline" target="_blank">
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
                  className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
                />
                <span className="text-[13px] text-[#6B7C93]">
                  I agree to receive occasional offers from this operator.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        className="w-full h-[56px] rounded-[12px] bg-[#0C447C] text-white font-semibold text-[16px] hover:bg-[#093a6b] transition-colors active:scale-[0.98]"
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
      <label className="block text-[13px] font-medium text-[#6B7C93] mb-1.5">
        {label}
        {required && <span className="text-[#D63B3B] ml-0.5">*</span>}
        {helper && <span className="font-normal ml-1 text-[#6B7C93]">— {helper}</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-[#D63B3B] mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full h-[52px] px-4 rounded-[10px] text-[15px]',
    'border bg-white text-[#0D1B2A]',
    'placeholder:text-[#6B7C93]',
    'focus:outline-none focus:ring-2 focus:ring-[#0C447C]/30 focus:border-[#0C447C]',
    hasError ? 'border-[#D63B3B] bg-[#FDEAEA]' : 'border-[#D0E2F3]'
  )
}
