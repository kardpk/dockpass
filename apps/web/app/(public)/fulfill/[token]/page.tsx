import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { verifyPin } from '@/app/api/dashboard/fulfillment/staff-link/route'
import { cookies } from 'next/headers'
import { StaffFulfillmentClient } from '@/components/dashboard/StaffFulfillmentClient'
import type { FulfillmentOrderRow } from '@/lib/webhooks/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dock Staff — Add-On Fulfillment',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ pin?: string }>
}

export default async function StaffFulfillmentPage({ params, searchParams }: PageProps) {
  const { token }    = await params
  const { pin }      = await searchParams ?? {}
  const supabase     = createServiceClient()
  const today        = new Date().toISOString().slice(0, 10)

  // ── 1. Look up operator by token ─────────────────────────────────────────
  const { data: operator } = await supabase
    .from('operators')
    .select('id, company_name, fulfillment_pin, fulfillment_token_expires')
    .eq('fulfillment_token', token)
    .single()

  if (!operator) return notFound()

  // Check token expiry (if set)
  if (operator.fulfillment_token_expires) {
    const expiry = new Date(operator.fulfillment_token_expires as string)
    if (expiry < new Date()) return notFound()
  }

  // ── 2. PIN check ─────────────────────────────────────────────────────────
  const hasPin = !!(operator.fulfillment_pin as string | null)

  // Check cookie-based session first (set after successful PIN entry)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(`staff-auth-${token}`)
  const pinVerified = sessionCookie?.value === 'verified'

  // If PIN required and not yet verified: show PIN form
  if (hasPin && !pinVerified) {
    // If a pin was submitted via query param (from form action), verify it
    if (pin) {
      const valid = verifyPin(pin, operator.fulfillment_pin as string)
      if (!valid) {
        // Return PIN form with error — client component handles this
        return (
          <StaffFulfillmentClient
            operatorName={(operator.company_name as string | null) ?? 'Fulfillment Board'}
            requiresPin
            pinError
            token={token}
            grouped={{}}
            date={today}
          />
        )
      }
      // Valid PIN — set cookie and fall through (Next.js will re-render with cookie)
      // Note: In a full implementation, set-cookie must be via a server action or API route.
      // For now, show the board — the PIN check redirects via the form action pattern.
    } else {
      // No PIN submitted yet — show PIN form
      return (
        <StaffFulfillmentClient
          operatorName={(operator.company_name as string | null) ?? 'Fulfillment Board'}
          requiresPin
          pinError={false}
          token={token}
          grouped={{}}
          date={today}
        />
      )
    }
  }

  // ── 3. Fetch fulfillment orders for today ─────────────────────────────────
  const { data: rows } = await supabase
    .from('v_fulfillment_board')
    .select('*')
    .eq('operator_id', operator.id)
    .eq('trip_date', today)

  const shaped: FulfillmentOrderRow[] = (rows ?? []).map(r => ({
    tripId:            r.trip_id as string,
    tripDate:          r.trip_date as string,
    departureTime:     r.departure_time as string,
    operatorId:        r.operator_id as string,
    boatName:          r.boat_name as string,
    slipNumber:        (r.slip_number as string | null) ?? null,
    addonId:           r.addon_id as string,
    addonName:         r.addon_name as string,
    category:          r.category as FulfillmentOrderRow['category'],
    prepTimeHours:     Number(r.prep_time_hours) || 0,
    orderId:           r.order_id as string,
    quantity:          Number(r.quantity) || 1,
    fulfillmentStatus: r.fulfillment_status as FulfillmentOrderRow['fulfillmentStatus'],
    fulfillmentNotes:  (r.fulfillment_notes as string | null) ?? null,
    totalCents:        Number(r.total_cents) || 0,
    notes:             (r.notes as string | null) ?? null,
    guestName:         'Guest',        // PII hidden on staff board
  }))

  // Group by departure_time
  const grouped: Record<string, FulfillmentOrderRow[]> = {}
  for (const row of shaped) {
    const key = row.departureTime ?? 'Unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key]!.push(row)
  }

  return (
    <StaffFulfillmentClient
      operatorName={(operator.company_name as string | null) ?? 'Fulfillment Board'}
      requiresPin={false}
      pinError={false}
      token={token}
      grouped={grouped}
      date={today}
    />
  )
}
