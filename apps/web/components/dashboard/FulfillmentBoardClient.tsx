'use client'

import { useState, useCallback } from 'react'
import { AddonFulfillmentCard } from '@/components/dashboard/AddonFulfillmentCard'
import { ChevronLeft, ChevronRight, CheckCircle2, PackageCheck } from 'lucide-react'
import type { FulfillmentOrderRow, FulfillmentStatus } from '@/lib/webhooks/types'

interface FulfillmentBoardClientProps {
  initialDate: string
  grouped:     Record<string, FulfillmentOrderRow[]>
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  } catch { return dateStr }
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const STATUS_ORDER: FulfillmentStatus[] = ['ordered', 'prepping', 'ready', 'loaded', 'delivered']

export function FulfillmentBoardClient({ initialDate, grouped }: FulfillmentBoardClientProps) {
  const [date,         setDate]         = useState(initialDate)
  const [orders,       setOrders]       = useState<Record<string, FulfillmentOrderRow[]>>(grouped)
  const [loading,      setLoading]      = useState(false)
  const [allLoadedFor, setAllLoadedFor] = useState<Record<string, boolean>>({})  // boatKey → confirmed

  // ── Date navigation ──────────────────────────────────────────────────────
  const navigateDate = useCallback(async (newDate: string) => {
    setLoading(true)
    setDate(newDate)
    setAllLoadedFor({})
    try {
      const res  = await fetch(`/api/dashboard/fulfillment?date=${newDate}`)
      const json = await res.json()
      setOrders((json as { grouped: Record<string, FulfillmentOrderRow[]> }).grouped ?? {})
    } catch {
      setOrders({})
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Single order advance ─────────────────────────────────────────────────
  const handleAdvance = useCallback(async (
    orderId: string,
    newStatus: FulfillmentStatus
  ) => {
    const res = await fetch(`/api/dashboard/fulfillment/${orderId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) throw new Error('Failed to update')

    setOrders(prev => {
      const next = { ...prev }
      for (const time of Object.keys(next)) {
        next[time] = (next[time] ?? []).map(o =>
          o.orderId === orderId ? { ...o, fulfillmentStatus: newStatus } : o
        )
      }
      return next
    })
  }, [])

  // ── All-loaded for a boat group ───────────────────────────────────────────
  const handleAllLoaded = useCallback(async (boatKey: string, boatOrders: FulfillmentOrderRow[]) => {
    const pending = boatOrders.filter(
      o => STATUS_ORDER.indexOf(o.fulfillmentStatus) < STATUS_ORDER.indexOf('loaded')
    )
    if (pending.length === 0) return

    try {
      await Promise.all(pending.map(o =>
        fetch(`/api/dashboard/fulfillment/${o.orderId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'loaded' }),
        })
      ))

      // Optimistic update — all to loaded
      setOrders(prev => {
        const next = { ...prev }
        const orderIds = new Set(pending.map(o => o.orderId))
        for (const time of Object.keys(next)) {
          next[time] = (next[time] ?? []).map(o =>
            orderIds.has(o.orderId) ? { ...o, fulfillmentStatus: 'loaded' } : o
          )
        }
        return next
      })

      // Mark boat as confirmed, clear after 4 s
      setAllLoadedFor(prev => ({ ...prev, [boatKey]: true }))
      setTimeout(() => setAllLoadedFor(prev => ({ ...prev, [boatKey]: false })), 4000)

      // Push notification to operator (fire-and-forget)
      const firstOrder = boatOrders[0]
      if (firstOrder) {
        fetch('/api/workers/push-trip-update', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId:  firstOrder.tripId,
            type:    'addon_loaded',
            message: `All add-ons for ${firstOrder.boatName} loaded. Ready for departure.`,
          }),
        }).catch(() => {/* non-fatal */})
      }
    } catch {
      // Non-fatal — individual cards still reflect real state via page reload
    }
  }, [])

  const departureTimes = Object.keys(orders).sort()
  const isToday        = date === new Date().toISOString().slice(0, 10)
  const totalOrders    = Object.values(orders).flat().length

  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>

      {/* Date navigation */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 10px' }}>
          Fulfillment
        </h1>

        {/* Prev / date display / next + date input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigateDate(offsetDate(date, -1))}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--color-paper)',
              border: '1px solid var(--color-line-soft)', cursor: 'pointer',
              color: 'var(--color-ink)',
            }}
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Date label — tapping opens native date picker via hidden input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <p className="font-mono" style={{
              fontSize: 'var(--t-mono-xs)', fontWeight: 600,
              color: 'var(--color-ink)', letterSpacing: '0.05em',
              textAlign: 'center', margin: 0,
            }}>
              {isToday ? 'TODAY · ' : ''}{formatDate(date)}
            </p>
            <input
              type="date"
              value={date}
              onChange={e => e.target.value && navigateDate(e.target.value)}
              style={{
                position: 'absolute',
                inset:    0,
                opacity:  0,
                cursor:   'pointer',
                width:    '100%',
              }}
              aria-label="Select date"
            />
          </div>

          <button
            onClick={() => navigateDate(offsetDate(date, 1))}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--color-paper)',
              border: '1px solid var(--color-line-soft)', cursor: 'pointer',
              color: 'var(--color-ink)',
            }}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--s-8)', color: 'var(--color-ink-muted)' }}>
          Loading...
        </div>
      )}

      {/* Empty state */}
      {!loading && totalOrders === 0 && (
        <div
          className="tile"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 'var(--s-10)', gap: 'var(--s-3)',
            borderStyle: 'dashed', textAlign: 'center',
          }}
        >
          <PackageCheck size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} />
          <p style={{ fontSize: 'var(--t-body-md)', color: 'var(--color-ink-muted)', margin: 0 }}>
            No add-on orders to fulfill on this date.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => navigateDate(offsetDate(date, -1))}
              style={{ fontSize: 12, color: 'var(--color-ink-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Yesterday
            </button>
            <button
              onClick={() => navigateDate(offsetDate(date, 1))}
              style={{ fontSize: 12, color: 'var(--color-ink-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}

      {/* Departure time groups */}
      {!loading && departureTimes.map(time => {
        const timeOrders = orders[time] ?? []
        const boatGroups: Record<string, FulfillmentOrderRow[]> = {}

        for (const o of timeOrders) {
          const key = `${o.boatName}||${o.slipNumber ?? ''}`
          if (!boatGroups[key]) boatGroups[key] = []
          boatGroups[key]!.push(o)
        }

        return (
          <section key={time}>
            {/* Departure time header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
              marginBottom: 'var(--s-3)',
              paddingBottom: 'var(--s-2)',
              borderBottom: '1.5px solid var(--color-ink)',
            }}>
              <span className="font-mono" style={{
                fontSize: 'var(--t-mono-sm)', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-ink)',
                fontWeight: 700,
              }}>
                {time} Departures
              </span>
            </div>

            {/* Boat sub-sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              {Object.entries(boatGroups).map(([boatKey, boatOrders]) => {
                const firstOrder   = boatOrders[0]!
                const allLoaded    = boatOrders.every(
                  o => STATUS_ORDER.indexOf(o.fulfillmentStatus) >= STATUS_ORDER.indexOf('loaded')
                )
                const justConfirmed = allLoadedFor[boatKey] === true

                return (
                  <div
                    key={boatKey}
                    className="tile"
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    {/* Boat header */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-line-soft)',
                    }}>
                      <p className="font-mono" style={{
                        margin: 0, fontSize: 'var(--t-mono-xs)',
                        fontWeight: 700, color: 'var(--color-ink)',
                        letterSpacing: '0.06em',
                      }}>
                        {firstOrder.boatName}
                        {firstOrder.slipNumber && ` · Slip ${firstOrder.slipNumber}`}
                        <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400 }}>
                          {' '}· {boatOrders.length} order{boatOrders.length !== 1 ? 's' : ''}
                        </span>
                      </p>
                    </div>

                    {/* Order cards */}
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {boatOrders.map(order => (
                        <AddonFulfillmentCard
                          key={order.orderId}
                          order={order}
                          onAdvance={handleAdvance}
                        />
                      ))}
                    </div>

                    {/* All Loaded group button */}
                    {!allLoaded && (
                      <div style={{ padding: '0 12px 12px' }}>
                        <button
                          onClick={() => handleAllLoaded(boatKey, boatOrders)}
                          style={{
                            width:        '100%',
                            height:       36,
                            background:   'var(--color-bone)',
                            border:       '1px solid var(--color-line)',
                            fontSize:     11,
                            fontWeight:   700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            color:        'var(--color-ink-secondary)',
                            cursor:       'pointer',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'center',
                            gap:          6,
                          }}
                        >
                          <CheckCircle2 size={13} /> Mark all loaded for {firstOrder.boatName}
                        </button>
                      </div>
                    )}

                    {/* Confirmed flash */}
                    {justConfirmed && (
                      <div style={{
                        padding:    '10px 14px',
                        background: '#f0fdf4',
                        borderTop:  '1px solid #bbf7d0',
                        display:    'flex',
                        alignItems: 'center',
                        gap:        8,
                        fontSize:   12,
                        color:      '#166534',
                        fontWeight: 600,
                      }}>
                        <CheckCircle2 size={14} /> All add-ons loaded — boat ready.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
