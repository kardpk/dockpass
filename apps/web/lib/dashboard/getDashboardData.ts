import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { DashboardGuest, DashboardStats, OperatorTripDetail, AddonSummaryItem } from '@/types'

export interface DashboardHomeData {
  todaysTrips: OperatorTripDetail[]
  upcomingTrips: OperatorTripDetail[]
  stats: DashboardStats
  hasBoats: boolean
  hasTrips: boolean
}

export async function getDashboardHomeData(
  operatorId: string
): Promise<DashboardHomeData> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]!

  const [
    todayResult,
    upcomingResult,
    statsResult,
    boatCountResult,
  ] = await Promise.all([
    // Today's trips (active or upcoming today)
    supabase
      .from('trips')
      .select(`
        id, slug, trip_code, trip_date, departure_time,
        duration_hours, max_guests, status, charter_type,
        requires_approval, special_notes, started_at, buoy_policy_id,
        boats (
          id, boat_name, boat_type, marina_name,
          marina_address, slip_number, lat, lng,
          captain_name, waiver_text, safety_cards
        ),
        guests (
          id, full_name, language_preference,
          dietary_requirements, is_non_swimmer,
          is_seasickness_prone, waiver_signed,
          waiver_signed_at, approval_status,
          checked_in_at, created_at,
          safety_acknowledgments, waiver_text_hash,
          guest_addon_orders (
            quantity, total_cents,
            addons ( name, emoji )
          )
        )
      `)
      .eq('operator_id', operatorId)
      .eq('trip_date', today)
      .in('status', ['upcoming', 'active'])
      .is('guests.deleted_at', null)
      .order('departure_time', { ascending: true }),

    // Next 7 days upcoming
    supabase
      .from('trips')
      .select(`
        id, slug, trip_code, trip_date, departure_time,
        duration_hours, max_guests, status, charter_type,
        requires_approval, special_notes,
        boats ( id, boat_name, marina_name, slip_number ),
        guests ( id, waiver_signed )
      `)
      .eq('operator_id', operatorId)
      .eq('status', 'upcoming')
      .gt('trip_date', today)
      .lte('trip_date',
        new Date(Date.now() + 7 * 86400000)
          .toISOString().split('T')[0]!
      )
      .is('guests.deleted_at', null)
      .order('trip_date', { ascending: true })
      .order('departure_time', { ascending: true })
      .limit(5),

    // Monthly stats
    getMonthlyStats(operatorId),

    // Has any boats?
    supabase
      .from('boats')
      .select('id', { count: 'exact', head: true })
      .eq('operator_id', operatorId)
      .eq('is_active', true),
  ])

  const todayRaw = todayResult.data ?? []
  const upcomingRaw = upcomingResult.data ?? []

  return {
    todaysTrips: todayRaw.map(shapeTripDetail),
    upcomingTrips: upcomingRaw.map(shapeTripDetail),
    stats: statsResult,
    hasBoats: (boatCountResult.count ?? 0) > 0,
    hasTrips: todayRaw.length > 0 || upcomingRaw.length > 0,
  }
}

async function getMonthlyStats(
  operatorId: string
): Promise<DashboardStats> {
  const supabase = await createClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [tripsResult, revenueResult, ratingResult] = await Promise.all([
    supabase
      .from('trips')
      .select('id, guests(id)', { count: 'exact' })
      .eq('operator_id', operatorId)
      .gte('trip_date', startOfMonth.toISOString().split('T')[0]!)
      .in('status', ['upcoming', 'active', 'completed']),

    supabase
      .from('guest_addon_orders')
      .select('total_cents')
      .eq('operator_id', operatorId)
      .gte('created_at', startOfMonth.toISOString())
      .eq('status', 'pending'),

    supabase
      .from('trip_reviews')
      .select('rating')
      .eq('operator_id', operatorId),
  ])

  const addonRevenue = (revenueResult.data ?? [])
    .reduce((sum: number, r: { total_cents: number }) => sum + r.total_cents, 0)

  const ratings = (ratingResult.data ?? []).map((r: { rating: number }) => r.rating)
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length) * 10) / 10
    : null

  const trips = tripsResult.data ?? []
  const totalGuests = trips.reduce((sum: number, t: { guests?: { id: string }[] }) => {
    return sum + ((t.guests as { id: string }[])?.length ?? 0)
  }, 0)

  return {
    bookingsThisMonth: tripsResult.count ?? 0,
    addonRevenueThisMonthCents: addonRevenue,
    averageRating: avgRating,
    totalGuestsThisMonth: totalGuests,
  }
}

// Shape raw Supabase row → typed OperatorTripDetail
export function shapeTripDetail(raw: Record<string, unknown>): OperatorTripDetail {
  const boat = (raw.boats ?? {}) as Record<string, unknown>
  const rawGuests = (raw.guests ?? []) as Record<string, unknown>[]

  const guests: DashboardGuest[] = rawGuests.map((g) => ({
    id: g.id as string,
    customerId: (g.customer_id as string | null) ?? null,
    fullName: (g.full_name as string) ?? '',
    languagePreference: (g.language_preference as string) ?? 'en',
    dietaryRequirements: (g.dietary_requirements as string | null) ?? null,
    isNonSwimmer: (g.is_non_swimmer as boolean) ?? false,
    isSeaSicknessProne: (g.is_seasickness_prone as boolean) ?? false,
    waiverSigned: (g.waiver_signed as boolean) ?? false,
    waiverSignedAt: (g.waiver_signed_at as string | null) ?? null,
    approvalStatus: (g.approval_status as DashboardGuest['approvalStatus']) ?? 'auto_approved',
    checkedInAt: (g.checked_in_at as string | null) ?? null,
    createdAt: (g.created_at as string) ?? '',
    safetyAcknowledgments: (g.safety_acknowledgments as { topic_key: string; acknowledgedAt: string }[]) ?? [],
    waiverTextHash: (g.waiver_text_hash as string | null) ?? null,
    addonOrders: ((g.guest_addon_orders ?? []) as Record<string, unknown>[]).map((o) => ({
      addonName: ((o.addons as Record<string, unknown>)?.name as string) ?? '',
      emoji: ((o.addons as Record<string, unknown>)?.emoji as string) ?? '🎁',
      quantity: (o.quantity as number) ?? 0,
      totalCents: (o.total_cents as number) ?? 0,
    })),
  }))

  const rawBookings = (raw.bookings ?? []) as Record<string, unknown>[]

  return {
    id: raw.id as string,
    slug: raw.slug as string,
    tripCode: raw.trip_code as string,
    tripDate: raw.trip_date as string,
    departureTime: raw.departure_time as string,
    durationHours: raw.duration_hours as number,
    maxGuests: raw.max_guests as number,
    status: raw.status as OperatorTripDetail['status'],
    charterType: raw.charter_type as OperatorTripDetail['charterType'],
    requiresApproval: raw.requires_approval as boolean,
    specialNotes: (raw.special_notes as string | null) ?? null,
    startedAt: (raw.started_at as string | null) ?? null,
    buoyPolicyId: (raw.buoy_policy_id as string | null) ?? null,
    boat: {
      id: (boat.id as string) ?? '',
      boatName: (boat.boat_name as string) ?? '',
      boatType: (boat.boat_type as string) ?? '',
      marinaName: (boat.marina_name as string) ?? '',
      marinaAddress: (boat.marina_address as string) ?? '',
      slipNumber: (boat.slip_number as string | null) ?? null,
      lat: boat.lat ? Number(boat.lat) : null,
      lng: boat.lng ? Number(boat.lng) : null,
      captainName: (boat.captain_name as string | null) ?? null,
      waiverText: (boat.waiver_text as string) ?? '',
      firmaTemplateId: (boat.firma_template_id as string | null) ?? null,
      safetyCards: (boat.safety_cards as Record<string, unknown>[]) ?? [],
    },
    guests,
    bookings: rawBookings.map((b) => ({
      id: b.id as string,
      organiserName: b.organiser_name as string,
      organiserEmail: (b.organiser_email as string | null) ?? null,
      maxGuests: b.max_guests as number,
      bookingCode: b.booking_code as string,
      notes: (b.notes as string | null) ?? null,
    })),
  }
}

// ─── Build add-on summary ────────────────────
export function buildAddonSummary(
  guests: DashboardGuest[]
): AddonSummaryItem[] {
  const map = new Map<string, AddonSummaryItem>()
  for (const guest of guests) {
    for (const order of guest.addonOrders) {
      const key = order.addonName
      const existing = map.get(key)
      if (existing) {
        existing.totalQty += order.quantity
        existing.totalCents += order.totalCents
        existing.guestNames.push(guest.fullName.split(' ')[0]!)
      } else {
        map.set(key, {
          addonId: key,
          addonName: order.addonName,
          emoji: order.emoji,
          totalQty: order.quantity,
          totalCents: order.totalCents,
          guestNames: [guest.fullName.split(' ')[0]!],
        })
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalQty - a.totalQty)
}

// ─── Build captain alerts ────────────────────
export function buildCaptainAlerts(guests: DashboardGuest[]) {
  return {
    nonSwimmers: guests.filter(g => g.isNonSwimmer).length,
    children: 0,
    seasicknessProne: guests.filter(g => g.isSeaSicknessProne).length,
    dietary: guests
      .filter(g => g.dietaryRequirements)
      .map(g => ({
        name: g.fullName.split(' ')[0]!,
        requirement: g.dietaryRequirements!,
      })),
  }
}
