import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { BarChart2, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add-On Revenue — BoatCheckin' }

interface MonthRow {
  month:       string   // ISO month 'YYYY-MM-01'
  order_count: number
  gmv_cents:   number
  fee_cents:   number
}

interface CategoryRow {
  category:   string
  gmv_cents:  number
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function monthLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch { return iso.slice(0, 7) }
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', beverage: 'Drinks', gear: 'Gear',
  safety: 'Safety', experience: 'Experience',
  seasonal: 'Seasonal', other: 'Other', general: 'General',
}

export default async function RevenuePage() {
  const { operator } = await requireOperator()
  const supabase     = createServiceClient()

  // ── Monthly roll-up via RPC (optional — gracefully falls back to empty) ────
  const { data: monthlyRaw } = await supabase.rpc('addon_revenue_monthly', {
    p_operator_id: operator.id,
  }).catch(() => ({ data: null })) as { data: MonthRow[] | null }

  const monthlyRows: MonthRow[] = Array.isArray(monthlyRaw) ? monthlyRaw.slice(0, 6) : []

  // ── Category breakdown (current month) — via order join ──────────────────
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const thisMonthIso = thisMonth.toISOString().slice(0, 10)

  let catRaw: { total_cents: unknown; addons: unknown }[] | null = null
  try {
    const { data } = await supabase
      .from('guest_addon_orders')
      .select(`
        total_cents,
        addons ( category ),
        trips!inner ( boats!inner ( operator_id ) )
      `)
      .eq('trips.boats.operator_id', operator.id)
      .eq('status', 'confirmed')
      .gte('payment_captured_at', thisMonthIso)
      .limit(500)
    catRaw = data as typeof catRaw
  } catch { /* non-fatal */ }


  // Group by category
  const catMap = new Map<string, number>()
  for (const row of (catRaw ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = (row.addons as any)?.category ?? 'general'
    catMap.set(cat, (catMap.get(cat) ?? 0) + (row.total_cents as number ?? 0))
  }
  const categoryRows: CategoryRow[] = Array.from(catMap.entries())
    .map(([category, gmv_cents]) => ({ category, gmv_cents }))
    .sort((a, b) => b.gmv_cents - a.gmv_cents)

  // ── This-month totals (from monthly rows or category sum) ────────────────
  const currentMonthIsoKey = new Date().toISOString().slice(0, 7)
  const thisMonthRow = monthlyRows.find(
    r => r.month?.startsWith(currentMonthIsoKey)
  )
  const thisMonthGmv    = thisMonthRow?.gmv_cents    ?? categoryRows.reduce((s, r) => s + r.gmv_cents, 0)
  const thisMonthOrders = thisMonthRow?.order_count  ?? 0
  const avgOrderValue   = thisMonthOrders > 0 ? Math.round(thisMonthGmv / thisMonthOrders) : 0
  const thisMonthFee    = thisMonthRow?.fee_cents     ?? Math.round(thisMonthGmv * 0.03)

  const maxGmv = Math.max(...monthlyRows.map(r => r.gmv_cents), 1)
  const maxCat = Math.max(...categoryRows.map(r => r.gmv_cents), 1)

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--s-6)' }}>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)', lineHeight: 1.1 }}
        >
          Add-On Revenue
        </h1>
        <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 6 }}>
          Monthly GMV and transaction report
        </p>
      </div>

      {/* This month summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 'var(--s-6)' }}>
        {[
          { icon: DollarSign, label: 'Add-on revenue', value: formatMoney(thisMonthGmv), sub: 'this month' },
          { icon: ShoppingBag, label: 'Orders placed', value: thisMonthOrders.toString(), sub: 'this month' },
          { icon: TrendingUp, label: 'Avg order value', value: formatMoney(avgOrderValue), sub: 'per order' },
          { icon: BarChart2,  label: 'Platform fee', value: formatMoney(thisMonthFee), sub: '3% of GMV' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div
            key={label}
            className="tile"
            style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} />
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
                {label}
              </span>
            </div>
            <span className="font-display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
              {value}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* 6-month bar chart */}
      {monthlyRows.length > 0 && (
        <div className="tile" style={{ padding: 'var(--s-5)', marginBottom: 'var(--s-6)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            Last 6 months
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {[...monthlyRows].reverse().map(row => {
              const pct = Math.round((row.gmv_cents / maxGmv) * 100)
              const current = row.month?.startsWith(currentMonthIsoKey)
              return (
                <div key={row.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                    {formatMoney(row.gmv_cents).replace('$', '$').split('.')[0]}
                  </span>
                  <div
                    style={{
                      width:        '100%',
                      height:       `${Math.max(4, pct)}%`,
                      background:   current ? 'var(--color-rust)' : 'var(--color-ink-muted)',
                      opacity:      current ? 1 : 0.4,
                      transition:   'height 500ms',
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-ink-muted)', letterSpacing: '0.06em' }}>
                    {monthLabel(row.month ?? '').split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryRows.length > 0 && (
        <div className="tile" style={{ padding: 'var(--s-5)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            By category — this month
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryRows.map(row => {
              const pct = Math.round((row.gmv_cents / maxCat) * 100)
              return (
                <div key={row.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', minWidth: 72, textAlign: 'right' }}>
                        {formatMoney(row.gmv_cents)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--color-bone)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-rust)', transition: 'width 500ms' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {monthlyRows.length === 0 && categoryRows.length === 0 && (
        <div className="tile" style={{ padding: 'var(--s-10)', textAlign: 'center', borderStyle: 'dashed' }}>
          <BarChart2 size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: 'var(--color-ink-muted)' }}>
            No confirmed add-on revenue yet.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 6 }}>
            Revenue appears here once guests place and pay for add-on orders.
          </p>
        </div>
      )}
    </div>
  )
}
