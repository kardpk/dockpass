'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Package, Fish, UtensilsCrossed, Wine, Waves, Anchor,
  Fuel, Shield, Camera, Music, ShoppingBag, CreditCard,
  CheckCircle2, AlertCircle, Clock, Tag, X,
} from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import type { JoinFlowState, AppliedPropertyCode } from '@/types'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// ─── Stripe promise (created once at module level) ────────────────────────────
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// ─── Addon category ordering ──────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  general:    'All',
  food:       'Food',
  beverage:   'Drinks',
  gear:       'Gear',
  safety:     'Safety',
  experience: 'Experience',
  seasonal:   'Seasonal',
  other:      'Other',
}

// ─── Icon mapper (no emoji — design system rule) ─────────────────────────────
function addonIcon(name: string, category: string) {
  const n = (name + ' ' + category).toLowerCase()
  if (/ice|cool/.test(n))                                    return Package
  if (/fish|tackle|rod|reel|bait|lobster/.test(n))           return Fish
  if (/food|lunch|snack|meal|sandwich|box/.test(n))          return UtensilsCrossed
  if (/champagne|wine|bar|beverage|spirit|bottle|cocktail|drink/.test(n)) return Wine
  if (/dive|snorkel|surf|wake|water.*sport|tube|towable/.test(n)) return Waves
  if (/music|band|dj|entertain/.test(n))                    return Music
  if (/fuel|surcharge|extend/.test(n))                      return Fuel
  if (/safety|life.*jack|first.*aid/.test(n))               return Shield
  if (/photo|camera/.test(n))                               return Camera
  if (/kayak|paddleboard/.test(n))                          return Anchor
  return ShoppingBag
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function isInSeason(from: string | null, until: string | null): boolean {
  if (!from || !until) return true
  const today    = new Date().toISOString().slice(0, 10)
  return today >= from && today <= until
}

function isCutoffPassed(tripDepartureIso: string, cutoffHours: number): boolean {
  if (!cutoffHours) return false
  const deadline = new Date(tripDepartureIso).getTime() - cutoffHours * 3_600_000
  return Date.now() > deadline
}

function cutoffLabel(tripDepartureIso: string, cutoffHours: number): string | null {
  if (!cutoffHours) return null
  const deadlineMs  = new Date(tripDepartureIso).getTime() - cutoffHours * 3_600_000
  const remainingMs = deadlineMs - Date.now()
  if (remainingMs <= 0) return null
  if (remainingMs > 3 * 3_600_000) return null // > 3 hrs away, no badge needed
  const hrs  = Math.floor(remainingMs / 3_600_000)
  const mins = Math.floor((remainingMs % 3_600_000) / 60_000)
  return `Order by ${hrs}h${mins > 0 ? ` ${mins}m` : ''}`
}

// ─── Discount math ────────────────────────────────────────────────────────────
function computeDiscountedPrice(
  priceCents: number,
  category: string,
  code: AppliedPropertyCode | null,
): number {
  if (!code) return priceCents
  if (priceCents === 0) return 0
  if (code.discountType === 'unlock_addons') return priceCents // unlock = no price change

  const applies =
    !code.applicableCategories ||
    code.applicableCategories.includes(category) ||
    code.applicableCategories.includes('general')

  if (!applies) return priceCents

  if (code.discountType === 'percent') {
    return Math.max(0, Math.round(priceCents * (1 - code.discountValue / 100)))
  }
  if (code.discountType === 'fixed_cents') {
    return Math.max(0, priceCents - code.discountValue)
  }
  return priceCents
}

// ─── Addon availability ───────────────────────────────────────────────────────
type AddonAvailability = 'available' | 'cutoff_passed' | 'not_in_season'

function addonAvailability(
  addon: { cutoffHours: number; isSeasonal: boolean; seasonalFrom: string | null; seasonalUntil: string | null },
  tripDepartureIso: string,
): AddonAvailability {
  if (isCutoffPassed(tripDepartureIso, addon.cutoffHours)) return 'cutoff_passed'
  if (addon.isSeasonal && !isInSeason(addon.seasonalFrom, addon.seasonalUntil)) return 'not_in_season'
  return 'available'
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddonRow {
  id:            string
  name:          string
  description:   string | null
  emoji:         string
  priceCents:    number
  maxQuantity:   number
  category:      string
  cutoffHours:   number
  prepTimeHours: number
  isSeasonal:    boolean
  seasonalFrom:  string | null
  seasonalUntil: string | null
}

interface StepAddonsProps {
  addons:           AddonRow[]
  guestId:          string
  tripSlug:         string
  state:            JoinFlowState
  onUpdate:         (p: Partial<JoinFlowState>) => void
  onComplete:       () => void
  onSkip:           () => void
  addonPaymentMode: 'stripe' | 'external' | 'free'
  hasPropertyCodes: boolean
  operatorId:       string
  tripDepartureIso: string
}

// ─── Stripe payment sub-component ────────────────────────────────────────────
function StripePaymentForm({
  tripSlug,
  guestId,
  paymentIntentId,
  onSuccess,
  onError,
}: {
  tripSlug:        string
  guestId:         string
  paymentIntentId: string
  onSuccess:       () => void
  onError:         (msg: string) => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    if (!stripe || !elements) return
    setConfirming(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (error) { onError(error.message ?? 'Payment failed'); return }

      // Verify server-side
      const res = await fetch(`/api/trips/${tripSlug}/addons/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, paymentIntentId }),
      })
      if (!res.ok) {
        const j = await res.json()
        onError(j.error ?? 'Confirmation failed')
        return
      }
      onSuccess()
    } catch {
      onError('Connection error. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        onClick={handleConfirm}
        disabled={confirming || !stripe || !elements}
        style={{
          marginTop:   16,
          width:       '100%',
          height:      52,
          background:  'var(--color-ink)',
          color:       'var(--color-bone)',
          border:      'none',
          fontWeight:  600,
          fontSize:    15,
          cursor:      confirming ? 'wait' : 'pointer',
          opacity:     confirming ? 0.6 : 1,
          display:     'flex',
          alignItems:  'center',
          justifyContent: 'center',
          gap:         8,
        }}
      >
        {confirming ? <AnchorLoader size="sm" color="white" /> : (
          <><CreditCard size={16} /> Confirm payment</>
        )}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function StepAddons({
  addons, guestId, tripSlug, state, onUpdate,
  onComplete, onSkip,
  addonPaymentMode, hasPropertyCodes, tripDepartureIso,
}: StepAddonsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('general')
  const [codeInput,      setCodeInput]       = useState('')
  const [codeApplying,   setCodeApplying]    = useState(false)
  const [codeError,      setCodeError]       = useState('')
  const [isOrdering,     setIsOrdering]      = useState(false)
  const [orderError,     setOrderError]      = useState('')
  const [showStripeForm, setShowStripeForm]  = useState(false)

  // Skip step if no addons
  if (addons.length === 0) { onComplete(); return null }

  const appliedCode   = state.appliedPropertyCode
  const clientSecret  = state.stripeClientSecret
  const intentId      = state.stripePaymentIntentId

  // ── Category tabs ────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const found = new Set<string>(['general'])
    for (const a of addons) {
      if (a.category && a.category !== 'general') found.add(a.category)
    }
    // Only show Seasonal tab if any addon is currently in-season
    const hasActiveSeasonal = addons.some(
      a => a.isSeasonal && today >= (a.seasonalFrom ?? '') && today <= (a.seasonalUntil ?? '')
    )
    if (!hasActiveSeasonal) found.delete('seasonal')
    return Array.from(found)
  }, [addons])

  // ── Filtered addons for active category ──────────────────────────────────
  const visibleAddons = useMemo(() =>
    activeCategory === 'general'
      ? addons
      : addons.filter(a => a.category === activeCategory),
    [addons, activeCategory]
  )

  // ── Discount + total calculation ─────────────────────────────────────────
  const { subtotalCents, discountCents, totalCents } = useMemo(() => {
    let subtotal = 0
    let discounted = 0
    for (const [addonId, qty] of Object.entries(state.addonQuantities)) {
      if (!qty) continue
      const addon = addons.find(a => a.id === addonId)
      if (!addon) continue
      const orig   = addon.priceCents * qty
      const final  = computeDiscountedPrice(addon.priceCents, addon.category, appliedCode) * qty
      subtotal  += orig
      discounted += final
    }
    return {
      subtotalCents:  subtotal,
      discountCents:  subtotal - discounted,
      totalCents:     discounted,
    }
  }, [state.addonQuantities, addons, appliedCode])

  const hasOrders = Object.values(state.addonQuantities).some(qty => qty > 0)

  function setQty(addonId: string, qty: number, max: number) {
    onUpdate({ addonQuantities: { ...state.addonQuantities, [addonId]: Math.max(0, Math.min(qty, max)) } })
  }

  // ── Property code validation ──────────────────────────────────────────────
  const applyCode = useCallback(async () => {
    if (!codeInput.trim()) return
    setCodeApplying(true)
    setCodeError('')
    try {
      const res = await fetch(`/api/trips/${tripSlug}/validate-code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: codeInput.trim().toUpperCase(), type: 'property' }),
      })
      const json = await res.json()
      if (!res.ok || !json.valid) {
        setCodeError(json.error ?? 'Invalid or expired code.')
        return
      }
      onUpdate({
        appliedPropertyCode: {
          id:                   json.id,
          code:                 json.code,
          discountType:         json.discountType,
          discountValue:        json.discountValue,
          applicableCategories: json.applicableCategories ?? null,
        },
      })
      setCodeInput('')
    } catch {
      setCodeError('Connection error. Please try again.')
    } finally {
      setCodeApplying(false)
    }
  }, [codeInput, tripSlug, onUpdate])

  function removeCode() {
    onUpdate({ appliedPropertyCode: null })
    setCodeInput('')
    setCodeError('')
  }

  // ── Submit (tri-mode) ─────────────────────────────────────────────────────
  async function submitOrders() {
    if (!hasOrders) { onComplete(); return }
    setIsOrdering(true)
    setOrderError('')

    const orders = Object.entries(state.addonQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }))

    try {
      const res = await fetch(`/api/trips/${tripSlug}/addons`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          orders,
          propertyCodeId: appliedCode?.id ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setOrderError(json.error ?? 'Order failed'); return }

      if (json.mode === 'stripe' && json.clientSecret) {
        // Stripe mode — show payment form
        onUpdate({
          stripeClientSecret:    json.clientSecret,
          stripePaymentIntentId: json.paymentIntentId,
        })
        setShowStripeForm(true)
        return
      }

      // External or free mode — confirmed immediately
      onComplete()
    } catch {
      setOrderError('Connection error. Please try again.')
    } finally {
      setIsOrdering(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: 8 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize:   20,
          fontWeight: 500,
          color:      'var(--color-ink)',
          letterSpacing: '-0.02em',
        }}>
          Add extras to your trip
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 4 }}>
          Pre-order before you arrive — everything loaded on your boat.
        </p>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div style={{
          display:       'flex',
          gap:           0,
          marginBottom:  16,
          borderBottom:  '1px solid var(--color-line-soft)',
          overflowX:     'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding:       '8px 14px',
                fontSize:      12,
                fontWeight:    activeCategory === cat ? 700 : 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color:         activeCategory === cat ? 'var(--color-rust)' : 'var(--color-ink-muted)',
                background:    'none',
                border:        'none',
                borderBottom:  activeCategory === cat ? '2px solid var(--color-rust)' : '2px solid transparent',
                cursor:        'pointer',
                whiteSpace:    'nowrap',
                marginBottom:  -1,
                transition:    'color 150ms, border-color 150ms',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Addon list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleAddons.map(addon => {
          const qty          = state.addonQuantities[addon.id] ?? 0
          const avail        = addonAvailability(addon, tripDepartureIso)
          const isDisabled   = avail !== 'available'
          const Icon         = addonIcon(addon.name, addon.category)
          const origPrice    = addon.priceCents
          const finalPrice   = computeDiscountedPrice(origPrice, addon.category, appliedCode)
          const hasDiscount  = finalPrice < origPrice && origPrice > 0
          const cutoffBadge  = cutoffLabel(tripDepartureIso, addon.cutoffHours)

          return (
            <div
              key={addon.id}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        12,
                padding:    '10px 12px',
                border:     qty > 0
                  ? '1.5px solid var(--color-brass)'
                  : '1px solid var(--color-line)',
                background: isDisabled
                  ? 'var(--color-bone)'
                  : qty > 0 ? 'rgba(184,136,42,0.04)' : 'var(--color-paper)',
                opacity:    isDisabled ? 0.55 : 1,
                transition: 'border-color 150ms, background 150ms',
              }}
            >
              {/* Icon */}
              <div style={{
                width:      38,
                height:     38,
                flexShrink: 0,
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: qty > 0 ? 'rgba(184,136,42,0.08)' : 'var(--color-bone)',
                border:     `1px solid ${qty > 0 ? 'var(--color-brass)' : 'var(--color-line-soft)'}`,
              }}>
                <Icon size={17} strokeWidth={1.5} style={{ color: qty > 0 ? 'var(--color-brass)' : 'var(--color-ink-muted)' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                    {addon.name}
                  </p>
                  {addon.isSeasonal && avail === 'available' && (
                    <span style={{
                      fontSize:    10,
                      fontWeight:  700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color:       'var(--color-brass)',
                      background:  'rgba(184,136,42,0.1)',
                      padding:     '1px 5px',
                    }}>
                      Seasonal
                    </span>
                  )}
                  {avail === 'not_in_season' && (
                    <span style={{
                      fontSize:    10,
                      fontWeight:  700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color:       'var(--color-ink-muted)',
                      background:  'var(--color-bone)',
                      padding:     '1px 5px',
                    }}>
                      Not in season
                    </span>
                  )}
                  {avail === 'cutoff_passed' && (
                    <span style={{
                      fontSize:    10,
                      fontWeight:  700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color:       'var(--color-ink-muted)',
                      background:  'var(--color-bone)',
                      padding:     '1px 5px',
                      display:     'flex',
                      alignItems:  'center',
                      gap:         3,
                    }}>
                      <Clock size={9} /> Order window closed
                    </span>
                  )}
                  {cutoffBadge && avail === 'available' && (
                    <span style={{
                      fontSize:    10,
                      fontWeight:  700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color:       '#b45309',
                      background:  '#fef3c7',
                      padding:     '1px 5px',
                      display:     'flex',
                      alignItems:  'center',
                      gap:         3,
                    }}>
                      <Clock size={9} /> {cutoffBadge}
                    </span>
                  )}
                </div>
                {addon.description && (
                  <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {addon.description}
                  </p>
                )}
                {/* Price (with discount) */}
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {origPrice === 0 ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Free</span>
                  ) : (
                    <>
                      <span style={{
                        fontSize:  13,
                        fontWeight: 700,
                        color:     hasDiscount ? 'var(--color-rust)' : 'var(--color-ink)',
                      }}>
                        {formatCurrency(finalPrice)}
                      </span>
                      {hasDiscount && (
                        <span style={{
                          fontSize:        12,
                          color:           'var(--color-ink-muted)',
                          textDecoration: 'line-through',
                        }}>
                          {formatCurrency(origPrice)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Stepper */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                border:       '1px solid var(--color-line)',
                overflow:     'hidden',
                flexShrink:   0,
                opacity:      isDisabled ? 0.4 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
              }}>
                <button
                  onClick={() => setQty(addon.id, qty - 1, addon.maxQuantity)}
                  disabled={qty === 0 || isDisabled}
                  style={{
                    width:   38,
                    height:  38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 500,
                    color:   'var(--color-ink)',
                    background: 'none',
                    border:  'none',
                    cursor:  'pointer',
                    opacity: qty === 0 ? 0.3 : 1,
                  }}
                  aria-label="Decrease"
                >
                  −
                </button>
                <span style={{
                  width:      28,
                  textAlign:  'center',
                  fontSize:   13,
                  fontWeight: 700,
                  color:      'var(--color-ink)',
                }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(addon.id, qty + 1, addon.maxQuantity)}
                  disabled={qty >= addon.maxQuantity || isDisabled}
                  style={{
                    width:   38,
                    height:  38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 500,
                    color:   'var(--color-ink)',
                    background: 'none',
                    border:  'none',
                    cursor:  'pointer',
                    opacity: qty >= addon.maxQuantity ? 0.3 : 1,
                  }}
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Property code panel */}
      {hasPropertyCodes && (
        <div style={{
          marginTop:  20,
          padding:    '12px 14px',
          background: 'var(--color-bone)',
          border:     '1px solid var(--color-line-soft)',
        }}>
          {appliedCode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)' }}>
                    {appliedCode.code} applied
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                    {appliedCode.discountType === 'percent'
                      ? `${appliedCode.discountValue}% off`
                      : appliedCode.discountType === 'fixed_cents'
                        ? `${formatCurrency(appliedCode.discountValue)} off`
                        : 'Hotel rate unlocked'}
                    {appliedCode.applicableCategories
                      ? ` on ${appliedCode.applicableCategories.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}`
                      : ' on all items'}
                  </p>
                </div>
              </div>
              <button
                onClick={removeCode}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Remove code"
              >
                <X size={14} style={{ color: 'var(--color-ink-muted)' }} />
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
                Hotel or marina guest? Enter your reservation code.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCode()}
                  placeholder="e.g. HOTEL2026"
                  maxLength={20}
                  style={{
                    flex:        1,
                    height:      36,
                    padding:     '0 10px',
                    fontSize:    13,
                    fontFamily:  'var(--font-mono)',
                    letterSpacing: '0.05em',
                    border:      `1px solid ${codeError ? 'var(--color-rust)' : 'var(--color-border)'}`,
                    background:  'var(--color-paper)',
                    color:       'var(--color-ink)',
                    outline:     'none',
                  }}
                />
                <button
                  onClick={applyCode}
                  disabled={codeApplying || !codeInput.trim()}
                  style={{
                    height:      36,
                    padding:     '0 14px',
                    fontSize:    12,
                    fontWeight:  700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color:       'var(--color-bone)',
                    background:  'var(--color-ink)',
                    border:      'none',
                    cursor:      codeApplying || !codeInput.trim() ? 'not-allowed' : 'pointer',
                    opacity:     codeApplying || !codeInput.trim() ? 0.5 : 1,
                    display:     'flex',
                    alignItems:  'center',
                    gap:         5,
                  }}
                >
                  {codeApplying ? <AnchorLoader size="sm" color="white" /> : (
                    <><Tag size={11} /> Apply</>
                  )}
                </button>
              </div>
              {codeError && (
                <p style={{ fontSize: 11, color: 'var(--color-rust)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} /> {codeError}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Order summary */}
      {hasOrders && (
        <div style={{
          marginTop:  20,
          padding:    '12px 14px',
          background: 'var(--color-bone)',
          border:     '1px solid var(--color-line-soft)',
        }}>
          {discountCents > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Subtotal</span>
                <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{formatCurrency(subtotalCents)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#16a34a' }}>
                  {appliedCode?.code} discount
                </span>
                <span style={{ fontSize: 12, color: '#16a34a' }}>−{formatCurrency(discountCents)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--color-line-soft)', paddingTop: 8 }} />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
              {addonPaymentMode === 'stripe'
                ? 'Charged now via secure payment'
                : addonPaymentMode === 'free'
                  ? 'Complimentary — no charge'
                  : 'Added to your stay account'}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>
              {totalCents === 0 ? 'Free' : formatCurrency(totalCents)}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4 }}>
            Add-ons will be loaded on your boat before departure.
          </p>
        </div>
      )}

      {/* Stripe PaymentElement (shown after order creation in stripe mode) */}
      {showStripeForm && clientSecret && stripePromise && intentId && (
        <div style={{ marginTop: 20 }}>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm
              tripSlug={tripSlug}
              guestId={guestId}
              paymentIntentId={intentId}
              onSuccess={onComplete}
              onError={(msg) => { setOrderError(msg); setShowStripeForm(false) }}
            />
          </Elements>
        </div>
      )}

      {orderError && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-rust)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertCircle size={13} /> {orderError}
        </p>
      )}

      {/* Primary action */}
      {!showStripeForm && (
        <>
          <button
            onClick={submitOrders}
            disabled={isOrdering}
            style={{
              marginTop:     20,
              width:         '100%',
              height:        52,
              background:    'var(--color-ink)',
              color:         'var(--color-bone)',
              border:        'none',
              fontFamily:    'var(--font-display)',
              fontSize:      15,
              fontWeight:    500,
              letterSpacing: '-0.01em',
              cursor:        isOrdering ? 'wait' : 'pointer',
              opacity:       isOrdering ? 0.6 : 1,
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'center',
              gap:           8,
              transition:    'opacity 150ms',
            }}
          >
            {isOrdering ? (
              <AnchorLoader size="sm" color="white" />
            ) : hasOrders ? (
              addonPaymentMode === 'stripe'
                ? `Pay ${totalCents === 0 ? 'free' : formatCurrency(totalCents)} & confirm`
                : `Confirm order${totalCents > 0 ? ` · ${formatCurrency(totalCents)}` : ''}`
            ) : (
              'Continue without extras'
            )}
          </button>

          {hasOrders && (
            <button
              onClick={onSkip}
              style={{
                width:      '100%',
                fontSize:   13,
                color:      'var(--color-ink-muted)',
                textDecoration: 'underline',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    '12px 0',
                minHeight:  44,
              }}
            >
              Skip — no extras needed
            </button>
          )}
        </>
      )}
    </div>
  )
}
