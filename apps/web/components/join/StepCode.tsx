'use client'

import { useState, useRef, useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState } from '@/types'

interface StepCodeProps {
  tripSlug: string
  state: JoinFlowState
  onUpdate: (partial: Partial<JoinFlowState>) => void
  onValidated: (waiverText: string, waiverHash: string, firmaTemplateId?: string | null, safetyCards?: unknown[]) => void
}

export function StepCode({ tripSlug, state, onUpdate, onValidated }: StepCodeProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lockCountdown, setLockCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Lockout countdown timer
  useEffect(() => {
    if (!state.codeLocked) return
    const remaining = Math.max(
      0,
      Math.ceil((state.codeLockUntil - Date.now()) / 1000)
    )
    setLockCountdown(remaining)
    if (remaining <= 0) {
      onUpdate({ codeLocked: false, codeError: '' })
      return
    }
    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onUpdate({ codeLocked: false, codeError: '' })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state.codeLocked, state.codeLockUntil, onUpdate])

  async function handleSubmit() {
    if (state.tripCode.length !== 4) {
      onUpdate({ codeError: 'Please enter your 4-character trip code' })
      return
    }
    setIsLoading(true)
    onUpdate({ codeError: '' })

    try {
      const res = await fetch(`/api/trips/${tripSlug}/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.tripCode }),
      })
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          const lockUntil = Date.now() + (json.lockSeconds ?? 1800) * 1000
          onUpdate({
            codeLocked: true,
            codeLockUntil: lockUntil,
            codeError: json.error ?? 'Locked out',
          })
        } else {
          onUpdate({
            codeAttempts: state.codeAttempts + 1,
            codeError: json.error ?? 'Incorrect code',
          })
          inputRef.current?.classList.add('animate-shake')
          setTimeout(() => inputRef.current?.classList.remove('animate-shake'), 500)
        }
        return
      }

      onValidated(json.trip.waiverText ?? '', json.trip.waiverHash, json.trip.firmaTemplateId, json.trip.safetyCards)
    } catch {
      onUpdate({ codeError: 'Connection error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  return (
    <div className="pt-2">
      <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
        Enter your trip code
      </h2>
      <p className="text-[14px] text-[#6B7C93] mb-8">
        Check the message from your trip organiser
      </p>

      {/* 4-char code input */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          maxLength={4}
          value={state.tripCode}
          onChange={e =>
            onUpdate({ tripCode: e.target.value.toUpperCase(), codeError: '' })
          }
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={state.codeLocked || isLoading}
          placeholder="_ _ _ _"
          className={cn(
            'w-48 h-20 text-center text-[40px] font-mono font-black',
            'tracking-[0.3em] uppercase',
            'border-2 rounded-[16px] bg-white outline-none',
            'transition-all duration-150',
            state.codeError
              ? 'border-[#D63B3B] bg-[#FDEAEA]'
              : state.tripCode.length === 4
              ? 'border-[#1D9E75]'
              : 'border-[#D0E2F3]',
            'focus:border-[#0C447C] focus:ring-2 focus:ring-[#0C447C]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Trip code"
          aria-describedby={state.codeError ? 'code-error' : undefined}
        />

        {state.codeError && (
          <p id="code-error" className="text-[14px] text-[#D63B3B] text-center font-medium" role="alert">
            {state.codeError}
          </p>
        )}

        {state.codeLocked && lockCountdown > 0 && (
          <div className="px-4 py-3 rounded-[12px] bg-[#FEF3DC] text-[14px] text-[#E5910A] text-center">
            🔒 Try again in {Math.floor(lockCountdown / 60)}m {lockCountdown % 60}s
          </div>
        )}
      </div>

      {/* Invisible Turnstile (only if site key configured) */}
      {siteKey && (
        <Turnstile
          siteKey={siteKey}
          onSuccess={(token) => onUpdate({ turnstileToken: token })}
          options={{ theme: 'light', size: 'invisible' }}
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || state.codeLocked || state.tripCode.length !== 4}
        className={cn(
          'w-full h-[56px] rounded-[12px]',
          'font-semibold text-[16px]',
          'flex items-center justify-center gap-2',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]',
          'active:scale-[0.98]'
        )}
      >
        {isLoading ? <AnchorLoader size="sm" color="white" /> : 'Join this trip →'}
      </button>

      <p className="text-[12px] text-[#6B7C93] text-center mt-4">
        Your information is kept private and secure
      </p>

    </div>
  )
}
