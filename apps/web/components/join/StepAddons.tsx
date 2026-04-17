'use client'

import { useState, useEffect } from 'react'
import {
  Package, Utensils, Camera, Waves, Wine, Music, Fuel,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState } from '@/types'

// MASTER_DESIGN R1: no emojis — same category map as wizard Step9
function addonCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (/chef|food|meal|cater|picnic|lunch|dinner/.test(n)) return Utensils
  if (/photo|camera|photog/.test(n)) return Camera
  if (/dive|snorkel|surf|wakeboard|wake|water.*sport|water.*toy|tube|towable/.test(n)) return Waves
  if (/champagne|wine|bar|beverage|spirit|bottle|cocktail|drink/.test(n)) return Wine
  if (/music|band|dj|entertain/.test(n)) return Music
  if (/fuel|surcharge|extend/.test(n)) return Fuel
  return Package
}

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
        <h2 className="text-[20px] font-bold text-navy mb-1">Add extras to your trip</h2>
        <p className="text-[14px] text-text-mid">Pre-order before you arrive</p>
      </div>

      {/* Addon list */}
      <div className="space-y-2">
        {addons.map(addon => {
          const qty = state.addonQuantities[addon.id] ?? 0
          const AddonIcon = addonCategoryIcon(addon.name)
          return (
            <div
              key={addon.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-4)',
                padding: 'var(--s-3) var(--s-4)',
                borderRadius: 'var(--r-1)',
                border: qty > 0
                  ? '1.5px solid var(--color-brass)'
                  : '1px solid var(--color-line)',
                background: qty > 0 ? 'var(--color-bone)' : 'var(--color-paper)',
                transition: 'border-color var(--dur-fast), background var(--dur-fast)',
              }}
            >
              {/* Icon tile — no emoji */}
              <div
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 'var(--r-1)',
                  background: qty > 0 ? 'rgba(184,136,42,0.08)' : 'var(--color-bone)',
                  border: `1px solid ${qty > 0 ? 'var(--color-brass)' : 'var(--color-line-soft)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color var(--dur-fast), background var(--dur-fast)',
                }}
              >
                <AddonIcon
                  size={18}
                  strokeWidth={1.5}
                  style={{ color: qty > 0 ? 'var(--color-brass)' : 'var(--color-ink-muted)' }}
                  aria-hidden="true"
                />
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-navy truncate">{addon.name}</p>
                {addon.description && (
                  <p className="text-[12px] text-text-mid truncate">{addon.description}</p>
                )}
                <p className="text-[14px] font-bold text-navy mt-0.5">
                  {addon.priceCents === 0 ? 'Free' : formatCurrency(addon.priceCents)}
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center border border-border rounded-[10px] overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setQty(addon.id, qty - 1)}
                  disabled={qty === 0}
                  className="w-10 h-10 flex items-center justify-center text-[18px] text-navy font-medium hover:bg-gold-dim disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease"
                >
                  −
                </button>
                <span className="w-8 text-center text-[14px] font-bold text-navy">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(addon.id, qty + 1)}
                  disabled={qty >= addon.maxQuantity}
                  className="w-10 h-10 flex items-center justify-center text-[18px] text-navy font-medium hover:bg-gold-dim disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
        <div className="flex items-center justify-between p-4 rounded-[12px] bg-bg border border-border">
          <span className="text-[14px] font-medium text-text-mid">Your total</span>
          <span className="text-[18px] font-bold text-navy">{formatCurrency(totalCents)}</span>
        </div>
      )}

      {orderError && (
        <p className="text-[14px] text-error font-medium">{orderError}</p>
      )}

      <button
        onClick={submitOrders}
        disabled={isOrdering}
        className="w-full h-[56px] rounded-[12px] bg-navy text-white font-semibold text-[16px] hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
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
        className="w-full text-[14px] text-text-mid underline py-2 min-h-[44px]"
      >
        Skip — no add-ons
      </button>
    </div>
  )
}
