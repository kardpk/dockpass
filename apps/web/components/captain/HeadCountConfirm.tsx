'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface HeadCountConfirmProps {
  token: string
  digitalGuestCount: number
  onConfirmed?: (count: number) => void
}

export function HeadCountConfirm({
  token,
  digitalGuestCount,
  onConfirmed,
}: HeadCountConfirmProps) {
  const [count, setCount] = useState<string>(String(digitalGuestCount))
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    mismatch: boolean
    physicalCount: number
    digitalCount: number
  } | null>(null)

  const numericCount = parseInt(count, 10) || 0
  const mismatch = numericCount !== digitalGuestCount && count !== ''

  const handleConfirm = useCallback(async () => {
    if (numericCount <= 0 || confirming) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/captain/${token}/headcount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: numericCount }),
      })
      if (res.ok) {
        const json = await res.json()
        setResult(json.data)
        setConfirmed(true)
        onConfirmed?.(numericCount)
      }
    } catch {
      // Silent fail
    } finally {
      setConfirming(false)
    }
  }, [numericCount, confirming, token, onConfirmed])

  if (confirmed && result) {
    return (
      <div className={cn(
        'p-4 rounded-[16px] border-2',
        result.mismatch
          ? 'bg-[#FEF3DC] border-[#E5910A]'
          : 'bg-[#E8F9F4] border-[#1D9E75]'
      )}>
        <div className="flex items-center gap-3">
          <span className="text-[24px]">{result.mismatch ? '⚠️' : '✅'}</span>
          <div>
            <p className={cn(
              'text-[14px] font-bold',
              result.mismatch ? 'text-[#92400E]' : 'text-[#1D9E75]'
            )}>
              {result.mismatch
                ? `HEAD COUNT MISMATCH`
                : 'Head count confirmed'}
            </p>
            <p className="text-[12px] text-[#6B7C93] mt-0.5">
              {result.physicalCount} aboard · {result.digitalCount} registered
              {result.mismatch && ' · Operator notified'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          👥 Head Count Verification
        </h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-[13px] text-[#6B7C93]">
          Digital count: <span className="font-bold text-[#0D1B2A]">{digitalGuestCount} guests</span> registered
        </p>

        <div className="flex items-center gap-3">
          <label className="text-[13px] text-[#6B7C93] flex-shrink-0">
            Actual count aboard:
          </label>
          <div className="flex items-center border border-[#D0E2F3] rounded-[10px] overflow-hidden">
            <button
              type="button"
              onClick={() => setCount(String(Math.max(0, numericCount - 1)))}
              className="w-[44px] h-[44px] text-[18px] font-medium text-[#0C447C] hover:bg-[#E8F2FB] transition-colors flex items-center justify-center"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max="500"
              value={count}
              onChange={e => setCount(e.target.value)}
              className="w-16 h-[44px] text-center text-[18px] font-bold text-[#0D1B2A] border-none outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => setCount(String(numericCount + 1))}
              className="w-[44px] h-[44px] text-[18px] font-medium text-[#0C447C] hover:bg-[#E8F2FB] transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Mismatch warning */}
        {mismatch && (
          <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#FEF3DC] border border-[#E5910A]/30">
            <span className="text-[16px]">⚠️</span>
            <p className="text-[12px] text-[#92400E] font-medium">
              Mismatch detected: {numericCount} aboard vs {digitalGuestCount} registered.
              You can still confirm — the operator will be notified.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={numericCount <= 0 || confirming}
          className="
            w-full h-[48px] rounded-[12px]
            bg-[#0C447C] text-white font-semibold text-[14px]
            hover:bg-[#093a6b] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {confirming ? 'Confirming...' : `✓ Confirm ${numericCount} aboard`}
        </button>
      </div>
    </div>
  )
}
