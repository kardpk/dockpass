import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { addonOrderSchema } from '@/lib/security/sanitise'
import { auditLog } from '@/lib/security/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limit: 20 addon orders per hour per trip
  const limited = await rateLimit(req, {
    max: 20,
    window: 3600,
    key: `addons:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = addonOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
  }

  const { guestId, orders } = parsed.data
  const supabase = createServiceClient()

  // Verify guest exists and belongs to some trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id, operator_id')
    .eq('id', guestId)
    .is('deleted_at', null)
    .single()

  if (!guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  // Verify guest's trip matches the URL slug
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  // ── Fetch prices SERVER-SIDE — never trust client prices ─────────────────
  const addonIds = orders.map(o => o.addonId)
  const { data: addons } = await supabase
    .from('addons')
    .select('id, price_cents, max_quantity, is_available, name')
    .in('id', addonIds)
    .eq('is_available', true)

  if (!addons || addons.length !== addonIds.length) {
    return NextResponse.json(
      { error: 'One or more addons not available' },
      { status: 400 }
    )
  }

  const addonMap = new Map(addons.map(a => [a.id, a]))

  // Validate quantities against DB limits
  for (const order of orders) {
    const addon = addonMap.get(order.addonId)
    if (!addon) {
      return NextResponse.json(
        { error: `Addon not found: ${order.addonId}` },
        { status: 400 }
      )
    }
    if (order.quantity > addon.max_quantity) {
      return NextResponse.json(
        { error: `${addon.name}: max quantity is ${addon.max_quantity}` },
        { status: 400 }
      )
    }
  }

  // Build insert rows with server-calculated prices
  const insertRows = orders.map(order => {
    const addon = addonMap.get(order.addonId)!
    return {
      guest_id: guestId,
      trip_id: guest.trip_id,
      addon_id: order.addonId,
      operator_id: guest.operator_id,
      quantity: order.quantity,
      unit_price_cents: addon.price_cents,           // FROM DB
      total_cents: addon.price_cents * order.quantity, // CALCULATED SERVER-SIDE
      status: 'pending' as const,
    }
  })

  const { data: inserted, error } = await supabase
    .from('guest_addon_orders')
    .insert(insertRows)
    .select('id, addon_id, quantity, total_cents')

  if (error) {
    console.error('[addons:order]', error.code)
    return NextResponse.json(
      { error: 'Order failed. Please try again.' },
      { status: 500 }
    )
  }

  const totalCents = insertRows.reduce((s, r) => s + r.total_cents, 0)

  auditLog({
    action: 'addon_ordered',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'guest',
    entityId: guestId,
    changes: {
      tripId: guest.trip_id,
      orderCount: orders.length,
      totalCents,
    },
  })

  return NextResponse.json({ data: inserted, totalCents })
}
