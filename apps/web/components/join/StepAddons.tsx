'use client'

import { useState, useEffect } from 'react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState } from '@/types'

interface Addon {
  id: string
  name: string
  description: string | null
  emoji: string
  priceCents: number
  maxQuantity: number
}

interface StepAddonsProps {
  addons: Addon[]
  guestId: string
  tripSlug: string
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onComplete: () => void
  onSkip: () => void
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function StepAddons({
  addons, guestId, tripSlug, state, onUpdate,
  onComplete, onSkip,
}: StepAddonsProps) {
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')

  // Skip automatically when no addons available (in useEffect to avoid render-phase state updates)
  useEffect(() => {
    if (addons.length === 0) onComplete()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (addons.length === 0) return null

  const totalCents = Object.entries(state.addonQuantities).reduce((sum, [addonId, qty]) => {
    const addon = addons.find(a => a.id === addonId)
    return sum + (addon?.priceCents ?? 0) * qty
  }, 0)

  const hasOrders = Object.values(state.addonQuantities).some(qty => qty > 0)

  function setQty(addonId: string, qty: number) {
    onUpdate({ addonQuantities: { ...state.addonQuantities, [addonId]: Math.max(0, qty) } })
  }

  async function submitOrders() {
    if (!hasOrders) { onComplete(); return }
    setIsOrdering(true)
    setOrderError('')

    const orders = Object.entries(state.addonQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }))

    try {
      const res = await fetch(`/api/trips/${tripSlug}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, orders }),
      })
      if (!res.ok) {
        const json = await res.json()
        setOrderError(json.error ?? 'Order failed')
        return
      }
      onComplete()
    } catch {
      setOrderError('Connection error. Please try again.')
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="pt-2 space-y-4">
      <div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">Add extras to your trip</h2>
        <p className="text-[14px] text-[#6B7C93]">Pre-order before you arrive</p>
      </div>

      {/* Addon list */}
      <div className="space-y-2">
        {addons.map(addon => {
          const qty = state.addonQuantities[addon.id] ?? 0
          return (
            <div
              key={addon.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-[16px]',
                'border transition-colors',
                qty > 0 ? 'border-[#0C447C] bg-[#E8F2FB]' : 'border-[#D0E2F3] bg-white'
              )}
            >
              {/* Emoji */}
              <div className="w-12 h-12 rounded-[12px] bg-[#F5F8FC] flex items-center justify-center text-[24px] flex-shrink-0">
                {addon.emoji}
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#0D1B2A] truncate">{addon.name}</p>
                {addon.description && (
                  <p className="text-[12px] text-[#6B7C93] truncate">{addon.description}</p>
                )}
                <p className="text-[14px] font-bold text-[#0C447C] mt-0.5">
                  {addon.priceCents === 0 ? 'Free' : formatCurrency(addon.priceCents)}
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center border border-[#D0E2F3] rounded-[10px] overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setQty(addon.id, qty - 1)}
                  disabled={qty === 0}
                  className="w-10 h-10 flex items-center justify-center text-[18px] text-[#0C447C] font-medium hover:bg-[#E8F2FB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease"
                >
                  −
                </button>
                <span className="w-8 text-center text-[14px] font-bold text-[#0D1B2A]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(addon.id, qty + 1)}
                  disabled={qty >= addon.maxQuantity}
                  className="w-10 h-10 flex items-center justify-center text-[18px] text-[#0C447C] font-medium hover:bg-[#E8F2FB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      {totalCents > 0 && (
        <div className="flex items-center justify-between p-4 rounded-[12px] bg-[#F5F8FC] border border-[#D0E2F3]">
          <span className="text-[14px] font-medium text-[#6B7C93]">Your total</span>
          <span className="text-[18px] font-bold text-[#0C447C]">{formatCurrency(totalCents)}</span>
        </div>
      )}

      {orderError && (
        <p className="text-[14px] text-[#D63B3B] font-medium">{orderError}</p>
      )}

      <button
        onClick={submitOrders}
        disabled={isOrdering}
        className="w-full h-[56px] rounded-[12px] bg-[#0C447C] text-white font-semibold text-[16px] hover:bg-[#093a6b] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {isOrdering ? (
          <AnchorLoader size="sm" color="white" />
        ) : hasOrders ? (
          `Complete check-in · ${formatCurrency(totalCents)}`
        ) : (
          'Complete check-in →'
        )}
      </button>

      <button
        onClick={onSkip}
        className="w-full text-[14px] text-[#6B7C93] underline py-2 min-h-[44px]"
      >
        Skip — no add-ons
      </button>
    </div>
  )
}
