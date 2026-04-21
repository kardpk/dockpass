'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, PackageCheck, Lock } from 'lucide-react'
import type { FulfillmentOrderRow, FulfillmentStatus } from '@/lib/webhooks/types'
import { AddonFulfillmentCard } from '@/components/dashboard/AddonFulfillmentCard'

interface StaffFulfillmentClientProps {
  operatorName: string
  requiresPin:  boolean
  pinError:     boolean
  token:        string
  grouped:      Record<string, FulfillmentOrderRow[]>
  date:         string
}

const STATUS_ORDER: FulfillmentStatus[] = ['ordered', 'prepping', 'ready', 'loaded', 'delivered']

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  } catch { return dateStr }
}

export function StaffFulfillmentClient({
  operatorName, requiresPin, pinError, token, grouped, date,
}: StaffFulfillmentClientProps) {
  const [orders, setOrders] = useState(grouped)
  const [allLoadedFor, setAllLoadedFor] = useState<Record<string, boolean>>({})

  // ── PIN form (shown when PIN is required) ─────────────────────────────────
  if (requiresPin) {
    return (
      <div style={{
        minHeight:      '100svh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--color-bone)',
        padding:        '24px 20px',
      }}>
        <div style={{
          width:      '100%',
          maxWidth:   360,
          background: 'var(--color-paper)',
          border:     '1px solid var(--color-line)',
          padding:    '32px 24px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44,
              background:     'var(--color-bone)',
              border:         '1px solid var(--color-line-soft)',
              borderRadius:   '50%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 12px',
            }}>
              <Lock size={18} style={{ color: 'var(--color-ink-muted)' }} />
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>
              {operatorName}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
              Fulfillment Board — Staff Access
            </p>
          </div>

          {/* PIN form — submits via URL query param */}
          <form action={`/fulfill/${token}`} method="get">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
              Enter staff PIN
            </p>
            <input
              type="password"
              name="pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              autoFocus
              placeholder="4-digit PIN"
              style={{
                width:      '100%',
                height:     44,
                padding:    '0 12px',
                fontSize:   20,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.3em',
                textAlign:  'center',
                border:     `1px solid ${pinError ? 'var(--color-rust)' : 'var(--color-border)'}`,
                background: 'var(--color-paper)',
                color:      'var(--color-ink)',
                outline:    'none',
                marginBottom: 8,
              }}
            />
            {pinError && (
              <p style={{ fontSize: 12, color: 'var(--color-rust)', marginBottom: 8 }}>
                Incorrect PIN. Try again.
              </p>
            )}
            <button
              type="submit"
              style={{
                width:      '100%',
                height:     44,
                background: 'var(--color-ink)',
                color:      'var(--color-bone)',
                border:     'none',
                fontWeight: 700,
                fontSize:   13,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor:     'pointer',
              }}
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Main board ────────────────────────────────────────────────────────────
  const handleAdvance = useCallback(async (orderId: string, newStatus: FulfillmentStatus) => {
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

  const handleAllLoaded = useCallback(async (boatKey: string, boatOrders: FulfillmentOrderRow[]) => {
    const pending = boatOrders.filter(
      o => STATUS_ORDER.indexOf(o.fulfillmentStatus) < STATUS_ORDER.indexOf('loaded')
    )
    if (!pending.length) return
    await Promise.all(pending.map(o =>
      fetch(`/api/dashboard/fulfillment/${o.orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'loaded' }),
      })
    ))
    setOrders(prev => {
      const next = { ...prev }
      const ids = new Set(pending.map(o => o.orderId))
      for (const time of Object.keys(next)) {
        next[time] = (next[time] ?? []).map(o =>
          ids.has(o.orderId) ? { ...o, fulfillmentStatus: 'loaded' } : o
        )
      }
      return next
    })
    setAllLoadedFor(prev => ({ ...prev, [boatKey]: true }))
    setTimeout(() => setAllLoadedFor(prev => ({ ...prev, [boatKey]: false })), 4000)
  }, [])

  const departureTimes = Object.keys(orders).sort()
  const totalOrders    = Object.values(orders).flat().length

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-bg)', padding: '20px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p className="font-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Fulfillment board &middot; Staff
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
          {operatorName}
        </h1>
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4 }}>
          {formatDate(date)}
        </p>
      </div>

      {totalOrders === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <PackageCheck size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--color-ink-muted)' }}>
            No add-on orders to fulfill today.
          </p>
        </div>
      ) : (
        departureTimes.map(time => {
          const timeOrders = orders[time] ?? []
          const boatGroups: Record<string, FulfillmentOrderRow[]> = {}
          for (const o of timeOrders) {
            const key = `${o.boatName}||${o.slipNumber ?? ''}`
            if (!boatGroups[key]) boatGroups[key] = []
            boatGroups[key]!.push(o)
          }

          return (
            <section key={time} style={{ marginBottom: 24 }}>
              <p className="font-mono" style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-ink)',
                borderBottom: '1.5px solid var(--color-ink)',
                paddingBottom: 8, marginBottom: 12,
              }}>
                {time} Departures
              </p>

              {Object.entries(boatGroups).map(([boatKey, boatOrders]) => {
                const first      = boatOrders[0]!
                const allLoaded  = boatOrders.every(o => STATUS_ORDER.indexOf(o.fulfillmentStatus) >= STATUS_ORDER.indexOf('loaded'))
                const confirmed  = allLoadedFor[boatKey]

                return (
                  <div key={boatKey} className="tile" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-line-soft)' }}>
                      <p className="font-mono" style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '0.06em' }}>
                        {first.boatName}
                        {first.slipNumber && ` · Slip ${first.slipNumber}`}
                      </p>
                    </div>
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {boatOrders.map(order => (
                        <AddonFulfillmentCard key={order.orderId} order={order} onAdvance={handleAdvance} />
                      ))}
                    </div>
                    {!allLoaded && (
                      <div style={{ padding: '0 12px 12px' }}>
                        <button
                          onClick={() => handleAllLoaded(boatKey, boatOrders)}
                          style={{
                            width: '100%', height: 36,
                            background: 'var(--color-bone)', border: '1px solid var(--color-line)',
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                            color: 'var(--color-ink-secondary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <CheckCircle2 size={13} /> Mark all loaded — {first.boatName}
                        </button>
                      </div>
                    )}
                    {confirmed && (
                      <div style={{ padding: '10px 14px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> All loaded — boat ready.
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          )
        })
      )}
    </div>
  )
}
