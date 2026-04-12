# BoatCheckin — Phase 3D Agent Instructions
# Operator Dashboard: Live Guest Management
# @3D_OPERATOR_DASHBOARD

---

## CONTEXT

Phases 3A–3C built the full loop:
operator creates trip → guest checks in.

Phase 3D is what the OPERATOR sees
while that loop is running.

Conrad sends the WhatsApp message.
Guests start registering.
Conrad opens his dashboard and watches
them check in — live, without refreshing.

Then he downloads the manifest,
copies the WhatsApp reminder,
and shares the snapshot to his captain.

This is the operational control centre.
It must feel like a premium SaaS product.
It must be fast. It must be live.

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/02-ARCHITECTURE.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3D — Operator Dashboard
with live guest management.

Requires operator auth on every route.
All DB writes enforce operator_id ownership.
Supabase Realtime for live guest updates.
pdf-lib for USCG-format manifest.
HMAC token for captain snapshot.

Phases 3A, 3B, 3C are complete.
Build on top of them without breaking anything.
Replace the placeholder dashboard/page.tsx
with the full implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DATA LAYER + TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
1A. Dashboard data types
────────────────────────────────────────────

Add to: apps/web/types/index.ts

// ─── Full guest record for dashboard ────────
export interface DashboardGuest {
  id: string
  fullName: string
  languagePreference: string
  dietaryRequirements: string | null
  isNonSwimmer: boolean
  isSeaSicknessProne: boolean
  waiverSigned: boolean
  waiverSignedAt: string | null
  approvalStatus: 'pending' | 'approved' | 'declined' | 'auto_approved'
  checkedInAt: string | null
  createdAt: string
  addonOrders: {
    addonName: string
    emoji: string
    quantity: number
    totalCents: number
  }[]
}

// ─── Trip detail for operator ───────────────
export interface OperatorTripDetail {
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  charterType: CharterType
  requiresApproval: boolean
  specialNotes: string | null
  startedAt: string | null
  buoyPolicyId: string | null
  boat: {
    id: string
    boatName: string
    boatType: string
    marinaName: string
    marinaAddress: string
    slipNumber: string | null
    lat: number | null
    lng: number | null
    captainName: string | null
    waiverText: string
    safetyPoints: { id: string; text: string }[]
  }
  guests: DashboardGuest[]
  bookings: {
    id: string
    organiserName: string
    organiserEmail: string | null
    maxGuests: number
    bookingCode: string
    notes: string | null
  }[]
}

// ─── Dashboard home stats ───────────────────
export interface DashboardStats {
  bookingsThisMonth: number
  addonRevenueThisMontCents: number
  averageRating: number | null
  totalGuestsThisMonth: number
}

// ─── Add-on summary for trip ─────────────────
export interface AddonSummaryItem {
  addonId: string
  addonName: string
  emoji: string
  totalQty: number
  totalCents: number
  guestNames: string[]
}

// ─── Captain snapshot token ─────────────────
export interface CaptainSnapshotData {
  tripId: string
  slug: string
  boatName: string
  marinaName: string
  slipNumber: string | null
  tripDate: string
  departureTime: string
  durationHours: number
  captainName: string | null
  weather: { label: string; temperature: number; icon: string } | null
  alerts: {
    nonSwimmers: number
    children: number
    seasicknessProne: number
    dietary: { name: string; requirement: string }[]
  }
  guests: {
    id: string
    fullName: string
    waiverSigned: boolean
    languageFlag: string
    addonEmojis: string[]
  }[]
  addonSummary: AddonSummaryItem[]
  generatedAt: string
  expiresAt: string
}

────────────────────────────────────────────
1B. Dashboard data fetcher (server-only)
────────────────────────────────────────────

Create: apps/web/lib/dashboard/
  getDashboardData.ts
import 'server-only'

Fetches everything the dashboard home needs
in as few queries as possible.

import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { DashboardStats, OperatorTripDetail } from '@/types'

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
  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!

  // Run queries in parallel for speed
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
        requires_approval, special_notes,
        boats (
          id, boat_name, boat_type, marina_name,
          marina_address, slip_number, lat, lng,
          captain_name, waiver_text, safety_points
        ),
        guests (
          id, full_name, language_preference,
          dietary_requirements, is_non_swimmer,
          is_seasickness_prone, waiver_signed,
          waiver_signed_at, approval_status,
          checked_in_at, created_at,
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
    getMonthlyStats(operatorId, supabase),

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
  operatorId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<DashboardStats> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [tripsResult, revenueResult, ratingResult] = await Promise.all([
    // Bookings + guests this month
    supabase
      .from('trips')
      .select('id, guests(id)', { count: 'exact' })
      .eq('operator_id', operatorId)
      .gte('trip_date', startOfMonth.toISOString().split('T')[0]!)
      .in('status', ['upcoming', 'active', 'completed']),

    // Add-on revenue this month
    supabase
      .from('guest_addon_orders')
      .select('total_cents')
      .eq('operator_id', operatorId)
      .gte('created_at', startOfMonth.toISOString())
      .eq('status', 'pending'),

    // Average rating (all time)
    supabase
      .from('trip_reviews')
      .select('rating')
      .eq('operator_id', operatorId),
  ])

  const addonRevenue = (revenueResult.data ?? [])
    .reduce((sum, r) => sum + r.total_cents, 0)

  const ratings = (ratingResult.data ?? []).map(r => r.rating)
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
    : null

  const trips = tripsResult.data ?? []
  const totalGuests = trips.reduce((sum, t) => {
    return sum + ((t.guests as any[])?.length ?? 0)
  }, 0)

  return {
    bookingsThisMonth: tripsResult.count ?? 0,
    addonRevenueThisMontCents: addonRevenue,
    averageRating: avgRating,
    totalGuestsThisMonth: totalGuests,
  }
}

// Shape raw Supabase row → typed OperatorTripDetail
export function shapeTripDetail(raw: any): OperatorTripDetail {
  const boat = raw.boats ?? {}
  const guests: DashboardGuest[] = (raw.guests ?? []).map((g: any) => ({
    id: g.id,
    fullName: g.full_name,
    languagePreference: g.language_preference ?? 'en',
    dietaryRequirements: g.dietary_requirements,
    isNonSwimmer: g.is_non_swimmer ?? false,
    isSeaSicknessProne: g.is_seasickness_prone ?? false,
    waiverSigned: g.waiver_signed ?? false,
    waiverSignedAt: g.waiver_signed_at,
    approvalStatus: g.approval_status ?? 'auto_approved',
    checkedInAt: g.checked_in_at,
    createdAt: g.created_at,
    addonOrders: (g.guest_addon_orders ?? []).map((o: any) => ({
      addonName: o.addons?.name ?? '',
      emoji: o.addons?.emoji ?? '🎁',
      quantity: o.quantity,
      totalCents: o.total_cents,
    })),
  }))

  return {
    id: raw.id,
    slug: raw.slug,
    tripCode: raw.trip_code,
    tripDate: raw.trip_date,
    departureTime: raw.departure_time,
    durationHours: raw.duration_hours,
    maxGuests: raw.max_guests,
    status: raw.status,
    charterType: raw.charter_type,
    requiresApproval: raw.requires_approval,
    specialNotes: raw.special_notes,
    startedAt: raw.started_at ?? null,
    buoyPolicyId: raw.buoy_policy_id ?? null,
    boat: {
      id: boat.id ?? '',
      boatName: boat.boat_name ?? '',
      boatType: boat.boat_type ?? '',
      marinaName: boat.marina_name ?? '',
      marinaAddress: boat.marina_address ?? '',
      slipNumber: boat.slip_number ?? null,
      lat: boat.lat ? Number(boat.lat) : null,
      lng: boat.lng ? Number(boat.lng) : null,
      captainName: boat.captain_name ?? null,
      waiverText: boat.waiver_text ?? '',
      safetyPoints: boat.safety_points ?? [],
    },
    guests,
    bookings: (raw.bookings ?? []).map((b: any) => ({
      id: b.id,
      organiserName: b.organiser_name,
      organiserEmail: b.organiser_email,
      maxGuests: b.max_guests,
      bookingCode: b.booking_code,
      notes: b.notes,
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
    children: 0, // extend when child flag added
    seasicknessProne: guests.filter(g => g.isSeaSicknessProne).length,
    dietary: guests
      .filter(g => g.dietaryRequirements)
      .map(g => ({
        name: g.fullName.split(' ')[0]!,
        requirement: g.dietaryRequirements!,
      })),
  }
}

────────────────────────────────────────────
1C. Manifest PDF generator (server-only)
────────────────────────────────────────────

Create: apps/web/lib/pdf/manifest.ts
import 'server-only'

Full USCG-format passenger manifest.
Replaces the stub in BACKEND.md with
a complete, production-quality version.

import 'server-only'
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'
import { formatTripDate, formatTime, formatDuration, formatCurrency } from '@/lib/utils/format'
import type { OperatorTripDetail, AddonSummaryItem } from '@/types'

const NAVY  = rgb(0.047, 0.267, 0.486)  // #0C447C
const TEAL  = rgb(0.114, 0.620, 0.459)  // #1D9E75
const CORAL = rgb(0.910, 0.349, 0.235)  // #E8593C
const GREY  = rgb(0.419, 0.486, 0.576)  // #6B7C93
const DARK  = rgb(0.051, 0.106, 0.165)  // #0D1B2A
const WHITE = rgb(1, 1, 1)
const LIGHT = rgb(0.961, 0.973, 0.988)  // #F5F8FC

export async function generateManifest(
  trip: OperatorTripDetail,
  operatorName: string,
  addonSummary: AddonSummaryItem[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Passenger Manifest — ${trip.boat.boatName}`)
  doc.setAuthor('BoatCheckin')
  doc.setCreator('BoatCheckin — boatcheckin.com')
  doc.setCreationDate(new Date())

  const page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 40

  // ── HEADER BAND ───────────────────────────
  page.drawRectangle({
    x: 0, y: y - 60,
    width, height: 80,
    color: NAVY,
  })
  page.drawText('PASSENGER MANIFEST', {
    x: 40, y: y - 20,
    size: 18, font: bold, color: WHITE,
  })
  page.drawText('BoatCheckin — boatcheckin.com', {
    x: width - 200, y: y - 20,
    size: 11, font: helvetica, color: rgb(1, 1, 1, 0.7),
  })

  y -= 80

  // ── TRIP DETAILS ─────────────────────────
  y -= 20
  const vessel = trip.boat.boatName
  const operator = operatorName
  const tripDate = formatTripDate(trip.tripDate)
  const depTime = formatTime(trip.departureTime)
  const duration = formatDuration(trip.durationHours)

  const details = [
    ['Vessel', vessel],
    ['Operator', operator],
    ['Date', tripDate],
    ['Departure', depTime],
    ['Duration', duration],
    ['Marina', trip.boat.marinaName],
    ['Slip', trip.boat.slipNumber ?? 'Not set'],
    ['Captain', trip.boat.captainName ?? 'Not set'],
    ['Charter Type', trip.charterType],
    ['Max Guests', trip.maxGuests.toString()],
  ]

  // Two-column layout
  const col1 = details.slice(0, 5)
  const col2 = details.slice(5)

  col1.forEach(([label, value], i) => {
    page.drawText(`${label}:`, {
      x: 40, y: y - i * 18,
      size: 9, font: bold, color: GREY,
    })
    page.drawText(value, {
      x: 115, y: y - i * 18,
      size: 9, font: helvetica, color: DARK,
    })
  })
  col2.forEach(([label, value], i) => {
    page.drawText(`${label}:`, {
      x: width / 2, y: y - i * 18,
      size: 9, font: bold, color: GREY,
    })
    page.drawText(value, {
      x: width / 2 + 80, y: y - i * 18,
      size: 9, font: helvetica, color: DARK,
    })
  })

  y -= 110

  // ── SECTION DIVIDER ──────────────────────
  function sectionHeader(title: string, yPos: number): number {
    page.drawRectangle({
      x: 40, y: yPos - 20,
      width: width - 80, height: 22,
      color: LIGHT,
    })
    page.drawText(title, {
      x: 45, y: yPos - 13,
      size: 10, font: bold, color: NAVY,
    })
    return yPos - 30
  }

  // ── GUEST LIST ───────────────────────────
  y = sectionHeader(
    `PASSENGERS (${trip.guests.length} / ${trip.maxGuests})`,
    y
  )

  // Column headers
  const cols = {
    num:    { x: 40,  w: 20  },
    name:   { x: 65,  w: 130 },
    lang:   { x: 200, w: 30  },
    waiver: { x: 240, w: 55  },
    ec:     { x: 305, w: 170 },
    diet:   { x: 480, w: 80  },
  }

  y -= 5
  page.drawText('#',        { x: cols.num.x,    y, size: 8, font: bold, color: GREY })
  page.drawText('Name',     { x: cols.name.x,   y, size: 8, font: bold, color: GREY })
  page.drawText('Lang',     { x: cols.lang.x,   y, size: 8, font: bold, color: GREY })
  page.drawText('Waiver',   { x: cols.waiver.x, y, size: 8, font: bold, color: GREY })
  page.drawText('Emergency Contact', { x: cols.ec.x, y, size: 8, font: bold, color: GREY })
  page.drawText('Dietary',  { x: cols.diet.x,   y, size: 8, font: bold, color: GREY })

  y -= 3
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: rgb(0.83, 0.89, 0.95),
  })
  y -= 16

  for (let i = 0; i < trip.guests.length; i++) {
    const guest = trip.guests[i]!

    // Zebra stripe
    if (i % 2 === 0) {
      page.drawRectangle({
        x: 40, y: y - 4,
        width: width - 80, height: 16,
        color: rgb(0.975, 0.984, 0.996),
      })
    }

    // Pending waiver — amber row
    if (!guest.waiverSigned) {
      page.drawRectangle({
        x: 40, y: y - 4,
        width: width - 80, height: 16,
        color: rgb(1, 0.976, 0.937),
      })
    }

    const rowY = y + 2
    page.drawText(`${i + 1}`, {
      x: cols.num.x, y: rowY,
      size: 9, font: helvetica, color: GREY,
    })

    // Truncate long names
    const name = guest.fullName.length > 22
      ? guest.fullName.slice(0, 20) + '...'
      : guest.fullName
    page.drawText(name, {
      x: cols.name.x, y: rowY,
      size: 9, font: helvetica, color: DARK,
    })

    // Flag
    const flag = langToFlag(guest.languagePreference)
    page.drawText(flag, {
      x: cols.lang.x, y: rowY,
      size: 9, font: helvetica, color: DARK,
    })

    // Waiver status
    if (guest.waiverSigned) {
      page.drawText('✓ Signed', {
        x: cols.waiver.x, y: rowY,
        size: 9, font: bold, color: TEAL,
      })
    } else {
      page.drawText('✗ Pending', {
        x: cols.waiver.x, y: rowY,
        size: 9, font: bold, color: CORAL,
      })
    }

    // Emergency contact (truncate)
    if (guest.addonOrders.length > 0) {
      // Show emojis instead of full EC name to save space
      // EC details printed per guest in page 2+
    }
    const ec = `${guest.addonOrders.map(o => o.emoji).join('')}`
    page.drawText(ec || '—', {
      x: cols.ec.x, y: rowY,
      size: 9, font: helvetica, color: GREY,
    })

    // Dietary
    const diet = guest.dietaryRequirements
    if (diet) {
      const dietShort = diet.length > 14 ? diet.slice(0, 12) + '...' : diet
      page.drawText(dietShort, {
        x: cols.diet.x, y: rowY,
        size: 8, font: helvetica,
        color: rgb(0.91, 0.35, 0.24),
      })
    }

    y -= 16
    if (y < 100) {
      // Add new page
      const newPage = doc.addPage(PageSizes.A4)
      y = newPage.getSize().height - 60
    }
  }

  y -= 10

  // ── ADD-ON ORDERS ────────────────────────
  if (addonSummary.length > 0) {
    y = sectionHeader('ADD-ON ORDERS', y)

    addonSummary.forEach(item => {
      page.drawText(
        `${item.emoji} ${item.addonName} × ${item.totalQty} — ${item.guestNames.join(', ')} — ${formatCurrency(item.totalCents)}`,
        { x: 45, y, size: 9, font: helvetica, color: DARK }
      )
      y -= 16
    })
    y -= 8
  }

  // ── PASSENGER ALERTS ─────────────────────
  const nonSwimmers = trip.guests.filter(g => g.isNonSwimmer)
  const seasick = trip.guests.filter(g => g.isSeaSicknessProne)
  const dietary = trip.guests.filter(g => g.dietaryRequirements)

  if (nonSwimmers.length > 0 || seasick.length > 0 || dietary.length > 0) {
    y = sectionHeader('PASSENGER ALERTS', y)

    if (nonSwimmers.length > 0) {
      page.drawText(
        `⚠ Non-swimmers: ${nonSwimmers.map(g => g.fullName.split(' ')[0]).join(', ')}`,
        { x: 45, y, size: 9, font: bold, color: CORAL }
      )
      y -= 16
    }
    if (seasick.length > 0) {
      page.drawText(
        `⚠ Seasickness prone: ${seasick.map(g => g.fullName.split(' ')[0]).join(', ')}`,
        { x: 45, y, size: 9, font: bold, color: CORAL }
      )
      y -= 16
    }
    if (dietary.length > 0) {
      dietary.forEach(g => {
        page.drawText(
          `• ${g.fullName.split(' ')[0]}: ${g.dietaryRequirements}`,
          { x: 45, y, size: 9, font: helvetica, color: DARK }
        )
        y -= 14
      })
    }
    y -= 8
  }

  // ── SAFETY ACKNOWLEDGMENTS ───────────────
  const allSigned = trip.guests.every(g => g.waiverSigned)
  if (allSigned && trip.guests.length > 0) {
    y = sectionHeader('LEGAL COMPLIANCE', y)
    page.drawText(
      `✓ All ${trip.guests.length} passengers have signed the digital liability waiver`,
      { x: 45, y, size: 9, font: helvetica, color: TEAL }
    )
    y -= 14
    page.drawText(
      `✓ Safety briefing acknowledged individually by all passengers`,
      { x: 45, y, size: 9, font: helvetica, color: TEAL }
    )
    y -= 14
  }

  // ── FOOTER ───────────────────────────────
  const finalPage = doc.getPages()[doc.getPageCount() - 1]!
  finalPage.drawLine({
    start: { x: 40, y: 60 },
    end: { x: width - 40, y: 60 },
    thickness: 0.5,
    color: rgb(0.83, 0.89, 0.95),
  })
  finalPage.drawText(
    `Generated by BoatCheckin (boatcheckin.com) · ${new Date().toLocaleString('en-US')} · Keep a copy for USCG compliance`,
    { x: 40, y: 45, size: 7, font: helvetica, color: GREY }
  )
  finalPage.drawText(
    `Trip ID: ${trip.id} · Vessel: ${trip.boat.boatName}`,
    { x: 40, y: 34, size: 7, font: helvetica, color: GREY }
  )

  return doc.save()
}

function langToFlag(code: string): string {
  const map: Record<string, string> = {
    en: 'EN', es: 'ES', pt: 'PT',
    fr: 'FR', de: 'DE', it: 'IT',
  }
  return map[code] ?? code.toUpperCase()
}

────────────────────────────────────────────
1D. Captain snapshot token generator
────────────────────────────────────────────

Create: apps/web/lib/security/snapshot.ts
import 'server-only'

import 'server-only'
import { createHmac, randomBytes } from 'crypto'

// Snapshot token: HMAC signed, 1hr TTL
// Gives captain read-only access to trip
// No login required

export function generateSnapshotToken(tripId: string): string {
  const nonce = randomBytes(8).toString('hex')
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const payload = `${tripId}:${nonce}:${expiresAt}`
  const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET!)
  hmac.update(payload)
  const sig = hmac.digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifySnapshotToken(token: string): {
  tripId: string
  expired: boolean
} | null {
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null

    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET!)
    hmac.update(payload)
    const expected = hmac.digest('base64url')

    if (expected.length !== sig.length) return null
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    const match = require('crypto').timingSafeEqual(a, b)
    if (!match) return null

    const [tripId, , expiryStr] = payload.split(':')
    const expiry = parseInt(expiryStr ?? '0')
    const expired = Date.now() / 1000 > expiry

    return { tripId: tripId!, expired }
  } catch {
    return null
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. GET /api/dashboard/manifest/[tripId]
    Download passenger manifest as PDF
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/manifest/
  [tripId]/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { generateManifest } from '@/lib/pdf/manifest'
import { buildAddonSummary, shapeTripDetail } from '@/lib/dashboard/getDashboardData'
import { auditLog } from '@/lib/security/audit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const { operator } = await requireOperator()

  // Rate limit: 30 downloads per hour per operator
  const limited = await rateLimit(req, {
    max: 30, window: 3600,
    key: `manifest:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const supabase = createServiceClient()

  // Fetch trip with full guest + addon data
  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at, buoy_policy_id,
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_points
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', tripId)
    .eq('operator_id', operator.id)  // strict ownership
    .is('guests.deleted_at', null)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = shapeTripDetail(raw)
  const addonSummary = buildAddonSummary(trip.guests)

  // Generate PDF
  const pdfBytes = await generateManifest(
    trip,
    operator.full_name ?? 'Operator',
    addonSummary
  )

  // Audit the download
  auditLog({
    action: 'manifest_downloaded',
    operatorId: operator.id,
    entityType: 'trip',
    entityId: tripId,
    changes: { guestCount: trip.guests.length },
  }).catch(() => null)

  const filename = `dockpass-manifest-${trip.boat.boatName.replace(/\s+/g, '-').toLowerCase()}-${trip.tripDate}.pdf`

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBytes.length.toString(),
      'Cache-Control': 'no-store',
    },
  })
}

────────────────────────────────────────────
2B. POST /api/dashboard/trips/[id]/snapshot
    Generate captain snapshot token
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/trips/
  [id]/snapshot/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import type { CaptainSnapshotData } from '@/types'
import { buildCaptainAlerts, buildAddonSummary, shapeTripDetail } from '@/lib/dashboard/getDashboardData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 20, window: 3600,
    key: `snapshot:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const supabase = createServiceClient()

  // Verify ownership
  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, status, charter_type,
      boats (
        boat_name, marina_name, slip_number,
        captain_name, lat, lng, waiver_text, safety_points
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        approval_status, created_at,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = shapeTripDetail(raw)
  const alerts = buildCaptainAlerts(trip.guests)
  const addonSummary = buildAddonSummary(trip.guests)
  const token = generateSnapshotToken(id)

  const now = new Date()
  const expires = new Date(now.getTime() + 3600000)

  const snapshot: CaptainSnapshotData = {
    tripId: id,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    marinaName: trip.boat.marinaName,
    slipNumber: trip.boat.slipNumber,
    tripDate: trip.tripDate,
    departureTime: trip.departureTime,
    durationHours: trip.durationHours,
    captainName: trip.boat.captainName,
    weather: null, // fetched live on captain page
    alerts,
    guests: trip.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      waiverSigned: g.waiverSigned,
      languageFlag: LANGUAGE_FLAGS[g.languagePreference as any] ?? '🌐',
      addonEmojis: g.addonOrders.map(o => o.emoji),
    })),
    addonSummary,
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }

  // Cache snapshot in Redis (1 min TTL)
  const redis = getRedis()
  await redis.set(
    `cache:snapshot:${token}`,
    snapshot,
    { ex: 3600 }
  ).catch(() => null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const snapshotUrl = `${appUrl}/snapshot/${token}`

  return NextResponse.json({
    data: {
      token,
      snapshotUrl,
      expiresAt: expires.toISOString(),
    },
  })
}

────────────────────────────────────────────
2C. PUT /api/dashboard/guests/[id]/approve
    Approve or decline a pending guest
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/guests/
  [id]/approve/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approved', 'declined']),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('guests')
    .update({
      approval_status: parsed.data.action,
      approved_at: parsed.data.action === 'approved'
        ? new Date().toISOString()
        : null,
    })
    .eq('id', id)
    .eq('operator_id', operator.id) // ownership enforced
    .select('id, full_name, trip_id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  auditLog({
    action: parsed.data.action === 'approved'
      ? 'approval_granted' : 'approval_denied',
    operatorId: operator.id,
    entityType: 'guest',
    entityId: id,
    changes: { guestName: data.full_name },
  }).catch(() => null)

  return NextResponse.json({ data: { id, status: parsed.data.action } })
}

────────────────────────────────────────────
2D. DELETE /api/dashboard/guests/[id]/remove
    Remove guest from trip (soft delete)
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/guests/
  [id]/remove/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Soft delete — never hard delete guest records
  const { data, error } = await supabase
    .from('guests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, full_name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  auditLog({
    action: 'guest_removed',
    operatorId: operator.id,
    entityType: 'guest',
    entityId: id,
    changes: { guestName: data.full_name },
  }).catch(() => null)

  return NextResponse.json({ data: { removed: true } })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — DASHBOARD HOME PAGE (B2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
3A. Dashboard home page (Server Component)
────────────────────────────────────────────

Update: apps/web/app/dashboard/page.tsx

Replace the Phase 1 placeholder with
the full dashboard home.

import { requireOperator } from '@/lib/security/auth'
import { getDashboardHomeData } from '@/lib/dashboard/getDashboardData'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { TodayTripCard } from '@/components/dashboard/TodayTripCard'
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow'
import { UpcomingTripsList } from '@/components/dashboard/UpcomingTripsList'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — BoatCheckin' }

export default async function DashboardPage() {
  const { operator } = await requireOperator()
  const data = await getDashboardHomeData(operator.id)

  // No boats yet — show setup prompt
  if (!data.hasBoats) {
    return <EmptyDashboard operatorName={
      operator.full_name?.split(' ')[0] ?? 'there'
    } />
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5 space-y-4">

      {/* Greeting */}
      <DashboardGreeting
        operatorName={operator.full_name?.split(' ')[0] ?? ''}
        todayTripCount={data.todaysTrips.length}
      />

      {/* Today's charter(s) */}
      {data.todaysTrips.map(trip => (
        <TodayTripCard key={trip.id} trip={trip} />
      ))}

      {/* Stats row */}
      <DashboardStatsRow stats={data.stats} />

      {/* Upcoming trips (next 7 days) */}
      {data.upcomingTrips.length > 0 && (
        <UpcomingTripsList trips={data.upcomingTrips} />
      )}

      {/* No trips at all */}
      {!data.hasTrips && (
        <div className="
          text-center py-10 px-4
          border border-dashed border-[#D0E2F3]
          rounded-[16px]
        ">
          <p className="text-[15px] text-[#6B7C93] mb-4">
            No trips created yet
          </p>
          <Link
            href="/dashboard/trips/new"
            className="
              inline-flex h-[52px] px-6 rounded-[12px]
              bg-[#0C447C] text-white font-semibold text-[15px]
              items-center hover:bg-[#093a6b] transition-colors
            "
          >
            Create your first trip →
          </Link>
        </div>
      )}
    </div>
  )
}

────────────────────────────────────────────
3B. DashboardGreeting
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  DashboardGreeting.tsx
(Server Component — time is computed server-side)

import { Sun, Moon, Sunset } from 'lucide-react'

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
  if (hour < 17) return { text: 'Good afternoon', emoji: '⛵' }
  return { text: 'Good evening', emoji: '🌙' }
}

export function DashboardGreeting({
  operatorName,
  todayTripCount,
}: {
  operatorName: string
  todayTripCount: number
}) {
  const { text, emoji } = getGreeting()

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold text-[#0D1B2A]">
        {text}, {operatorName} {emoji}
      </h1>
      <p className="text-[15px] text-[#6B7C93] mt-1">
        {todayTripCount === 0
          ? 'No charters today'
          : todayTripCount === 1
          ? 'You have 1 charter today'
          : `You have ${todayTripCount} charters today`
        }
      </p>
    </div>
  )
}

────────────────────────────────────────────
3C. TodayTripCard — the command centre card
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  TodayTripCard.tsx
'use client'

This is the most important card on the
dashboard. Shows live guest progress.
Uses Supabase Realtime to update without refresh.

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { Copy, Check, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, formatTripDate, formatDuration } from '@/lib/utils/format'
import type { OperatorTripDetail, DashboardGuest } from '@/types'

export function TodayTripCard({ trip }: { trip: OperatorTripDetail }) {
  const [guests, setGuests] = useState<DashboardGuest[]>(trip.guests)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const signed = guests.filter(g => g.waiverSigned).length
  const pending = guests.filter(g => !g.waiverSigned).length
  const total = guests.length
  const progress = (total / trip.maxGuests) * 100

  // ── Supabase Realtime subscription ──────
  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(`trip-guests-${trip.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${trip.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newGuest = payload.new as any
            setGuests(prev => [
              ...prev,
              {
                id: newGuest.id,
                fullName: newGuest.full_name,
                languagePreference: newGuest.language_preference ?? 'en',
                dietaryRequirements: newGuest.dietary_requirements,
                isNonSwimmer: newGuest.is_non_swimmer ?? false,
                isSeaSicknessProne: newGuest.is_seasickness_prone ?? false,
                waiverSigned: newGuest.waiver_signed ?? false,
                waiverSignedAt: newGuest.waiver_signed_at,
                approvalStatus: newGuest.approval_status,
                checkedInAt: newGuest.checked_in_at,
                createdAt: newGuest.created_at,
                addonOrders: [],
              },
            ])
          } else if (payload.eventType === 'UPDATE') {
            setGuests(prev =>
              prev.map(g =>
                g.id === payload.new.id
                  ? { ...g, ...mapGuest(payload.new) }
                  : g
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setGuests(prev =>
              prev.filter(g => g.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [trip.id])

  function mapGuest(raw: any): Partial<DashboardGuest> {
    return {
      fullName: raw.full_name,
      waiverSigned: raw.waiver_signed,
      approvalStatus: raw.approval_status,
    }
  }

  // Pre-written WhatsApp reminder message
  const reminderMsg = [
    `Hi! Just a reminder about your charter tomorrow ⚓`,
    ``,
    `📋 ${total} of ${trip.maxGuests} guests checked in`,
    `${pending > 0 ? `⏳ ${pending} guest${pending !== 1 ? 's' : ''} still need${pending === 1 ? 's' : ''} to sign the waiver` : `✅ All waivers signed!`}`,
    ``,
    `Join link: ${process.env.NEXT_PUBLIC_APP_URL}/trip/${trip.slug}`,
    `Code: ${trip.tripCode}`,
  ].join('\n')

  async function copyReminder() {
    await navigator.clipboard.writeText(reminderMsg)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(
        `/api/dashboard/manifest/${trip.id}`
      )
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifest-${trip.tripDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="
      bg-[#0C447C] rounded-[20px] p-5 text-white
    ">
      {/* Trip header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[17px] font-bold">
            {trip.boat.boatName}
          </p>
          <p className="text-white/70 text-[13px] mt-0.5">
            {formatTripDate(trip.tripDate)} ·{' '}
            {formatTime(trip.departureTime)} ·{' '}
            {formatDuration(trip.durationHours)}
          </p>
          {trip.boat.slipNumber && (
            <p className="text-white/60 text-[12px] mt-0.5">
              📍 Slip {trip.boat.slipNumber} · {trip.boat.marinaName}
            </p>
          )}
        </div>
        <span className={cn(
          'text-[11px] font-bold px-2.5 py-1 rounded-full',
          trip.status === 'active'
            ? 'bg-[#1D9E75] text-white'
            : 'bg-white/20 text-white'
        )}>
          {trip.status === 'active' ? 'Active ●' : 'Today'}
        </span>
      </div>

      {/* Guest progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-semibold">
            {total} / {trip.maxGuests} checked in
          </span>
          <span className="text-[13px] text-white/70">
            {signed} signed · {pending > 0 ? (
              <span className="text-[#FEF3DC]">{pending} pending</span>
            ) : '✓ all signed'}
          </span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Mini guest list (first 4) */}
      {guests.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {guests.slice(0, 4).map(guest => (
            <div
              key={guest.id}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[10px]',
                guest.waiverSigned
                  ? 'bg-white/10'
                  : 'bg-[#E5910A]/20'
              )}
            >
              {/* Avatar */}
              <div className="
                w-7 h-7 rounded-full bg-white/20
                flex items-center justify-center
                text-[11px] font-bold flex-shrink-0
              ">
                {guest.fullName.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>

              <span className="text-[13px] font-medium flex-1 truncate">
                {guest.fullName.split(' ')[0]}
              </span>

              {/* Addon emojis */}
              <span className="text-[12px]">
                {guest.addonOrders.map(o => o.emoji).join(' ')}
              </span>

              {/* Waiver badge */}
              <span className={cn(
                'text-[11px] font-semibold',
                guest.waiverSigned ? 'text-[#4ADE80]' : 'text-[#FEF3DC]'
              )}>
                {guest.waiverSigned ? '✓' : '…'}
              </span>
            </div>
          ))}
          {guests.length > 4 && (
            <p className="text-[12px] text-white/60 pl-3">
              +{guests.length - 4} more · See full list →
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf || guests.length === 0}
          className="
            flex items-center justify-center gap-2
            h-[44px] rounded-[10px]
            bg-white/15 hover:bg-white/25
            text-[13px] font-medium text-white
            transition-colors disabled:opacity-40
          "
        >
          <FileText size={15} />
          {downloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>

        <button
          onClick={copyReminder}
          className="
            flex items-center justify-center gap-2
            h-[44px] rounded-[10px]
            bg-white/15 hover:bg-white/25
            text-[13px] font-medium text-white
            transition-colors
          "
        >
          {copiedMsg ? <Check size={15} /> : <Copy size={15} />}
          {copiedMsg ? 'Copied!' : 'Copy reminder'}
        </button>
      </div>

      <Link
        href={`/dashboard/trips/${trip.id}`}
        className="
          block text-center text-[13px] text-white/70
          underline mt-3 min-h-[44px] flex items-center
          justify-center hover:text-white transition-colors
        "
      >
        View full guest list →
      </Link>
    </div>
  )
}

────────────────────────────────────────────
3D. DashboardStatsRow
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  DashboardStatsRow.tsx
(Server Component)

import { formatCurrency } from '@/lib/utils/format'
import type { DashboardStats } from '@/types'

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: 'Charters this month',
      value: stats.bookingsThisMonth.toString(),
      icon: '⚓',
    },
    {
      label: 'Add-on revenue',
      value: formatCurrency(stats.addonRevenueThisMontCents),
      icon: '💰',
    },
    {
      label: 'Avg rating',
      value: stats.averageRating ? `${stats.averageRating}★` : '—',
      icon: '⭐',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(item => (
        <div
          key={item.label}
          className="
            bg-white rounded-[16px] p-4
            border border-[#D0E2F3]
            shadow-[0_1px_4px_rgba(12,68,124,0.06)]
          "
        >
          <div className="text-[20px] mb-1">{item.icon}</div>
          <p className="text-[17px] font-bold text-[#0D1B2A]">
            {item.value}
          </p>
          <p className="text-[11px] text-[#6B7C93] mt-0.5 leading-tight">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — TRIP DETAIL PAGE (B4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
4A. Trip detail page
────────────────────────────────────────────

Create: apps/web/app/dashboard/trips/[id]/
  page.tsx

import { notFound } from 'next/navigation'
import { requireOperator } from '@/lib/security/auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { shapeTripDetail, buildAddonSummary } from '@/lib/dashboard/getDashboardData'
import { TripDetailHeader } from '@/components/dashboard/TripDetailHeader'
import { GuestManagementTable } from '@/components/dashboard/GuestManagementTable'
import { AddonOrdersSummary } from '@/components/dashboard/AddonOrdersSummary'
import { TripActionBar } from '@/components/dashboard/TripActionBar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trip detail — BoatCheckin' }

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = await createSupabaseServer()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at, buoy_policy_id,
      bookings ( id, organiser_name, organiser_email,
        max_guests, booking_code, notes ),
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_points
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .order('created_at', {
      referencedTable: 'guests',
      ascending: true,
    })
    .single()

  if (error || !raw) notFound()

  const trip = shapeTripDetail(raw)
  const addonSummary = buildAddonSummary(trip.guests)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const whatsappMsg = [
    `Hi! Everything for your charter is here:`,
    ``,
    `👉 ${appUrl}/trip/${trip.slug}`,
    `Code: *${trip.tripCode}*`,
    ``,
    `Sign your waiver and order any extras before you arrive.`,
  ].join('\n')

  return (
    <div className="max-w-[720px] mx-auto px-4 py-5">
      <TripDetailHeader trip={trip} />

      <GuestManagementTable
        tripId={trip.id}
        initialGuests={trip.guests}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
      />

      {addonSummary.length > 0 && (
        <AddonOrdersSummary
          summary={addonSummary}
          className="mt-4"
        />
      )}

      {/* Sticky action bar */}
      <TripActionBar
        tripId={trip.id}
        tripSlug={trip.slug}
        status={trip.status}
        whatsappMessage={whatsappMsg}
      />
    </div>
  )
}

────────────────────────────────────────────
4B. TripDetailHeader
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  TripDetailHeader.tsx
(Server Component)

import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { OperatorTripDetail } from '@/types'

export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <div className="mb-5">
      {/* Back link */}
      <a
        href="/dashboard/trips"
        className="text-[13px] text-[#6B7C93] hover:text-[#0C447C] mb-3 inline-flex items-center gap-1"
      >
        ← All trips
      </a>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1B2A]">
            {trip.boat.boatName}
          </h1>
          <p className="text-[14px] text-[#6B7C93] mt-0.5">
            {formatTripDate(trip.tripDate)} · {formatTime(trip.departureTime)} · {formatDuration(trip.durationHours)}
          </p>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            📍 {trip.boat.marinaName}
            {trip.boat.slipNumber ? ` · Slip ${trip.boat.slipNumber}` : ''}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Trip code */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[12px] text-[#6B7C93]">Trip code</span>
        <span className="
          text-[18px] font-mono font-black tracking-[0.2em]
          text-[#0C447C]
        ">
          {trip.tripCode}
        </span>
      </div>

      {/* Buoy policy (if active) */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div className="
          mt-3 flex items-center gap-2
          px-3 py-2 rounded-[10px]
          bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30
        ">
          <span className="text-[12px]">🟢</span>
          <span className="text-[13px] font-medium text-[#1D9E75]">
            Insurance active · Policy {trip.buoyPolicyId}
          </span>
        </div>
      )}
    </div>
  )
}

────────────────────────────────────────────
4C. GuestManagementTable (live updates)
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  GuestManagementTable.tsx
'use client'

Live updating guest list with approve/decline
and remove actions. Uses Supabase Realtime.

'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { Check, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import type { DashboardGuest } from '@/types'

interface GuestManagementTableProps {
  tripId: string
  initialGuests: DashboardGuest[]
  maxGuests: number
  requiresApproval: boolean
}

export function GuestManagementTable({
  tripId, initialGuests, maxGuests, requiresApproval,
}: GuestManagementTableProps) {
  const [guests, setGuests] = useState<DashboardGuest[]>(initialGuests)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  const total = guests.length
  const signed = guests.filter(g => g.waiverSigned).length
  const pending = guests.filter(
    g => g.approvalStatus === 'pending'
  ).length

  // ── Realtime ────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`dashboard-guests-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const g = payload.new as any
            setGuests(prev => [...prev, {
              id: g.id,
              fullName: g.full_name,
              languagePreference: g.language_preference ?? 'en',
              dietaryRequirements: g.dietary_requirements,
              isNonSwimmer: g.is_non_swimmer ?? false,
              isSeaSicknessProne: g.is_seasickness_prone ?? false,
              waiverSigned: g.waiver_signed,
              waiverSignedAt: g.waiver_signed_at,
              approvalStatus: g.approval_status,
              checkedInAt: g.checked_in_at,
              createdAt: g.created_at,
              addonOrders: [],
            }])
          } else if (payload.eventType === 'UPDATE') {
            setGuests(prev => prev.map(g =>
              g.id === payload.new.id
                ? {
                    ...g,
                    waiverSigned: payload.new.waiver_signed,
                    approvalStatus: payload.new.approval_status,
                  }
                : g
            ))
          } else if (payload.eventType === 'DELETE') {
            setGuests(prev => prev.filter(g => g.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function approve(guestId: string) {
    setActioning(guestId)
    try {
      const res = await fetch(
        `/api/dashboard/guests/${guestId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approved' }),
        }
      )
      if (res.ok) {
        setGuests(prev => prev.map(g =>
          g.id === guestId ? { ...g, approvalStatus: 'approved' } : g
        ))
      }
    } finally {
      setActioning(null)
    }
  }

  async function decline(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(
        `/api/dashboard/guests/${guestId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'declined' }),
        }
      )
      setGuests(prev => prev.map(g =>
        g.id === guestId ? { ...g, approvalStatus: 'declined' } : g
      ))
    } finally {
      setActioning(null)
    }
  }

  async function remove(guestId: string) {
    if (!confirm('Remove this guest from the trip?')) return
    setActioning(guestId)
    try {
      const res = await fetch(
        `/api/dashboard/guests/${guestId}/remove`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setGuests(prev => prev.filter(g => g.id !== guestId))
      }
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="
      bg-white rounded-[20px] border border-[#D0E2F3]
      shadow-[0_1px_4px_rgba(12,68,124,0.06)]
      overflow-hidden
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Guests
          </h2>
          <div className="flex items-center gap-3">
            <span className="
              text-[13px] font-semibold
              text-[#0C447C]
            ">
              {total} / {maxGuests}
            </span>
            {pending > 0 && (
              <span className="
                text-[11px] font-semibold px-2 py-0.5
                rounded-full bg-[#FEF3DC] text-[#E5910A]
              ">
                {pending} pending approval
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full h-1.5 bg-[#E8F2FB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${Math.min((total / maxGuests) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-[#6B7C93]">
            {signed} waiver{signed !== 1 ? 's' : ''} signed
          </span>
          {total - signed > 0 && (
            <span className="text-[11px] text-[#E5910A]">
              {total - signed} pending
            </span>
          )}
        </div>
      </div>

      {/* Guest list */}
      {guests.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[15px] text-[#6B7C93]">
            No guests yet
          </p>
          <p className="text-[13px] text-[#6B7C93] mt-1">
            Share the trip link to start receiving check-ins
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F8FC]">
          {guests.map(guest => (
            <div
              key={guest.id}
              className={cn(
                'transition-colors',
                guest.approvalStatus === 'pending'
                  ? 'bg-[#FEF9EE]'
                  : guest.approvalStatus === 'declined'
                  ? 'bg-[#FFF4F4]'
                  : 'bg-white hover:bg-[#F5F8FC]'
              )}
            >
              {/* Guest row */}
              <div className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="
                    w-9 h-9 rounded-full bg-[#E8F2FB]
                    flex items-center justify-center
                    text-[12px] font-bold text-[#0C447C]
                    flex-shrink-0
                  ">
                    {guest.fullName.split(' ')
                      .map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="
                        text-[14px] font-medium text-[#0D1B2A]
                        truncate
                      ">
                        {guest.fullName}
                      </span>
                      <span className="text-[14px] flex-shrink-0">
                        {LANGUAGE_FLAGS[guest.languagePreference as any] ?? '🌐'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Waiver status */}
                      <span className={cn(
                        'text-[11px] font-medium',
                        guest.waiverSigned
                          ? 'text-[#1D9E75]'
                          : 'text-[#E5910A]'
                      )}>
                        {guest.waiverSigned ? '✓ Signed' : '⏳ Pending'}
                      </span>

                      {/* Addon emojis */}
                      {guest.addonOrders.length > 0 && (
                        <span className="text-[13px]">
                          {guest.addonOrders.map(o => o.emoji).join('')}
                        </span>
                      )}

                      {/* Flags */}
                      {guest.isNonSwimmer && (
                        <span className="text-[11px] bg-[#FDEAEA] text-[#D63B3B] px-1.5 py-0.5 rounded-full">
                          Non-swimmer
                        </span>
                      )}
                      {guest.dietaryRequirements && (
                        <span className="text-[11px] bg-[#FEF3DC] text-[#E5910A] px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                          {guest.dietaryRequirements}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {requiresApproval && guest.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => approve(guest.id)}
                          disabled={actioning === guest.id}
                          className="
                            w-8 h-8 rounded-full bg-[#E8F9F4]
                            flex items-center justify-center
                            text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white
                            transition-colors disabled:opacity-40
                          "
                          aria-label="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => decline(guest.id)}
                          disabled={actioning === guest.id}
                          className="
                            w-8 h-8 rounded-full bg-[#FDEAEA]
                            flex items-center justify-center
                            text-[#D63B3B] hover:bg-[#D63B3B] hover:text-white
                            transition-colors disabled:opacity-40
                          "
                          aria-label="Decline"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}

                    {/* Expand for more detail */}
                    <button
                      onClick={() => setExpanded(
                        expanded === guest.id ? null : guest.id
                      )}
                      className="
                        w-8 h-8 rounded-full
                        flex items-center justify-center
                        text-[#6B7C93] hover:bg-[#F5F8FC]
                      "
                      aria-label="Toggle details"
                    >
                      {expanded === guest.id
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                      }
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === guest.id && (
                  <div className="mt-3 pl-12 space-y-1.5">
                    {guest.dietaryRequirements && (
                      <p className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Dietary:</span>{' '}
                        {guest.dietaryRequirements}
                      </p>
                    )}
                    {guest.waiverSignedAt && (
                      <p className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Waiver signed:</span>{' '}
                        {new Date(guest.waiverSignedAt).toLocaleString()}
                      </p>
                    )}
                    {guest.addonOrders.length > 0 && (
                      <div className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Add-ons:</span>{' '}
                        {guest.addonOrders.map(o =>
                          `${o.emoji} ${o.addonName} ×${o.quantity}`
                        ).join(', ')}
                      </div>
                    )}
                    <button
                      onClick={() => remove(guest.id)}
                      disabled={actioning === guest.id}
                      className="
                        flex items-center gap-1.5 text-[12px]
                        text-[#D63B3B] hover:underline mt-1
                        disabled:opacity-40
                      "
                    >
                      <Trash2 size={12} />
                      Remove from trip
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

────────────────────────────────────────────
4D. AddonOrdersSummary
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  AddonOrdersSummary.tsx
(Server Component)

import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { AddonSummaryItem } from '@/types'

export function AddonOrdersSummary({
  summary, className,
}: {
  summary: AddonSummaryItem[]
  className?: string
}) {
  const totalRevenue = summary.reduce((s, i) => s + i.totalCents, 0)

  return (
    <div className={cn(
      'bg-white rounded-[20px] border border-[#D0E2F3]',
      'shadow-[0_1px_4px_rgba(12,68,124,0.06)] overflow-hidden',
      className
    )}>
      <div className="px-5 py-4 border-b border-[#F5F8FC] flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          Add-on orders
        </h2>
        <span className="text-[15px] font-bold text-[#0C447C]">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
      <div className="divide-y divide-[#F5F8FC]">
        {summary.map(item => (
          <div key={item.addonName} className="px-5 py-3 flex items-center gap-3">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[#0D1B2A]">
                {item.addonName} ×{item.totalQty}
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[14px] font-bold text-[#0C447C]">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

────────────────────────────────────────────
4E. TripActionBar — sticky bottom actions
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  TripActionBar.tsx
'use client'

Sticky bottom bar with 3 actions:
PDF manifest, WhatsApp message, Captain snapshot.

'use client'

import { useState } from 'react'
import { FileText, MessageCircle, Share2, Check, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripStatus } from '@/types'

interface TripActionBarProps {
  tripId: string
  tripSlug: string
  status: TripStatus
  whatsappMessage: string
}

export function TripActionBar({
  tripId, tripSlug, status, whatsappMessage,
}: TripActionBarProps) {
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [copiedSnapshot, setCopiedSnapshot] = useState(false)

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/dashboard/manifest/${tripId}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifest-${tripId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function copyWhatsApp() {
    await navigator.clipboard.writeText(whatsappMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function generateSnapshot() {
    setGeneratingSnapshot(true)
    try {
      const res = await fetch(
        `/api/dashboard/trips/${tripId}/snapshot`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSnapshotUrl(json.data.snapshotUrl)
    } catch {
      alert('Failed to generate captain link.')
    } finally {
      setGeneratingSnapshot(false)
    }
  }

  async function copySnapshot() {
    if (!snapshotUrl) return
    await navigator.clipboard.writeText(snapshotUrl)
    setCopiedSnapshot(true)
    setTimeout(() => setCopiedSnapshot(false), 2000)
  }

  return (
    <div className="
      fixed bottom-0 left-0 right-0 z-40
      bg-white border-t border-[#D0E2F3]
      px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3
      md:relative md:bottom-auto md:border-none
      md:bg-transparent md:px-0 md:pt-4 md:pb-0
    ">
      <div className="max-w-[720px] mx-auto">

        {/* Snapshot URL (shown after generation) */}
        {snapshotUrl && (
          <div className="
            mb-3 flex items-center gap-2
            p-3 rounded-[12px]
            bg-[#E8F2FB] border border-[#D0E2F3]
          ">
            <p className="text-[13px] text-[#0C447C] flex-1 truncate">
              📎 {snapshotUrl}
            </p>
            <button
              onClick={copySnapshot}
              className="
                flex items-center gap-1 px-3 py-1.5
                rounded-[8px] bg-[#0C447C] text-white
                text-[12px] font-medium flex-shrink-0
              "
            >
              {copiedSnapshot ? <Check size={12} /> : <Copy size={12} />}
              {copiedSnapshot ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              bg-[#F5F8FC] border border-[#D0E2F3]
              text-[#0C447C] hover:bg-[#E8F2FB]
              transition-colors disabled:opacity-40
              text-[11px] font-medium
            "
          >
            <FileText size={18} />
            {downloadingPdf ? 'Generating...' : 'Manifest PDF'}
          </button>

          <button
            onClick={copyWhatsApp}
            className="
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              bg-[#F5F8FC] border border-[#D0E2F3]
              text-[#0C447C] hover:bg-[#E8F2FB]
              transition-colors text-[11px] font-medium
            "
          >
            {copiedMsg
              ? <><Check size={18} /><span>Copied!</span></>
              : <><MessageCircle size={18} /><span>WhatsApp msg</span></>
            }
          </button>

          <button
            onClick={snapshotUrl ? copySnapshot : generateSnapshot}
            disabled={generatingSnapshot}
            className="
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              bg-[#0C447C] text-white
              hover:bg-[#093a6b] transition-colors
              disabled:opacity-40 text-[11px] font-medium
            "
          >
            {generatingSnapshot ? (
              <span>Generating...</span>
            ) : snapshotUrl ? (
              <><Share2 size={18} /><span>Copy captain link</span></>
            ) : (
              <><Share2 size={18} /><span>Share to captain</span></>
            )}
          </button>
        </div>

        {/* Padding for mobile bottom nav */}
        <div className="h-[72px] md:hidden" />
      </div>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/dashboard/
  manifestPdf.test.ts

import { describe, it, expect, vi } from 'vitest'
import { generateManifest } from '@/lib/pdf/manifest'
import { buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import type { OperatorTripDetail } from '@/types'

const mockTrip: OperatorTripDetail = {
  id: 'trip-1',
  slug: 'test-slug-abc',
  tripCode: 'SUN4',
  tripDate: '2024-10-21',
  departureTime: '14:00',
  durationHours: 4,
  maxGuests: 8,
  status: 'upcoming',
  charterType: 'captained',
  requiresApproval: false,
  specialNotes: null,
  startedAt: null,
  buoyPolicyId: null,
  boat: {
    id: 'boat-1',
    boatName: "Conrad's Yacht Miami",
    boatType: 'yacht',
    marinaName: 'Miami Beach Marina',
    marinaAddress: '300 Alton Rd, Miami Beach, FL',
    slipNumber: '14A',
    lat: 25.7786, lng: -80.1392,
    captainName: 'Captain Conrad',
    waiverText: 'Test waiver text...',
    safetyPoints: [],
  },
  guests: [
    {
      id: 'guest-1',
      fullName: 'Sofia Martinez',
      languagePreference: 'es',
      dietaryRequirements: null,
      isNonSwimmer: false,
      isSeaSicknessProne: false,
      waiverSigned: true,
      waiverSignedAt: '2024-10-20T10:00:00Z',
      approvalStatus: 'auto_approved',
      checkedInAt: null,
      createdAt: '2024-10-20T10:00:00Z',
      addonOrders: [
        { addonName: 'Champagne', emoji: '🥂', quantity: 1, totalCents: 8500 },
      ],
    },
    {
      id: 'guest-2',
      fullName: 'Ahmed Khan',
      languagePreference: 'en',
      dietaryRequirements: 'Nut allergy',
      isNonSwimmer: true,
      isSeaSicknessProne: true,
      waiverSigned: false,
      waiverSignedAt: null,
      approvalStatus: 'pending',
      checkedInAt: null,
      createdAt: '2024-10-20T11:00:00Z',
      addonOrders: [],
    },
  ],
  bookings: [],
}

describe('generateManifest', () => {
  it('returns a Uint8Array (PDF bytes)', async () => {
    const bytes = await generateManifest(
      mockTrip, 'Conrad Rivera', []
    )
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
  })

  it('PDF starts with %PDF-1', async () => {
    const bytes = await generateManifest(mockTrip, 'Conrad', [])
    const header = new TextDecoder().decode(bytes.slice(0, 8))
    expect(header).toContain('%PDF-1')
  })
})

describe('buildAddonSummary', () => {
  it('aggregates addons by name', () => {
    const summary = buildAddonSummary(mockTrip.guests)
    expect(summary).toHaveLength(1)
    expect(summary[0]?.addonName).toBe('Champagne')
    expect(summary[0]?.totalQty).toBe(1)
    expect(summary[0]?.totalCents).toBe(8500)
    expect(summary[0]?.guestNames).toContain('Sofia')
  })

  it('returns empty for guests with no orders', () => {
    const guestNoAddons = {
      ...mockTrip.guests[1]!,
      addonOrders: [],
    }
    expect(buildAddonSummary([guestNoAddons])).toHaveLength(0)
  })
})

describe('buildCaptainAlerts', () => {
  it('detects non-swimmers', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.nonSwimmers).toBe(1)
  })

  it('detects seasickness prone', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.seasicknessProne).toBe(1)
  })

  it('includes dietary requirements', () => {
    const alerts = buildCaptainAlerts(mockTrip.guests)
    expect(alerts.dietary).toHaveLength(1)
    expect(alerts.dietary[0]?.requirement).toBe('Nut allergy')
  })
})

Create: apps/web/__tests__/unit/dashboard/
  snapshotToken.test.ts

import { describe, it, expect } from 'vitest'
import {
  generateSnapshotToken,
  verifySnapshotToken,
} from '@/lib/security/snapshot'

vi.mock('server-only', () => ({}))

describe('snapshot tokens', () => {
  const tripId = 'trip-abc-123'

  it('generates a verifiable token', () => {
    const token = generateSnapshotToken(tripId)
    const result = verifySnapshotToken(token)
    expect(result).not.toBeNull()
    expect(result?.tripId).toBe(tripId)
    expect(result?.expired).toBe(false)
  })

  it('rejects tampered token', () => {
    const token = generateSnapshotToken(tripId)
    const [p, s] = token.split('.')
    expect(verifySnapshotToken(`${p}.TAMPERED${s}`)).toBeNull()
  })

  it('detects expired token', async () => {
    // Mock a token with past expiry
    const { createHmac, randomBytes } = await import('crypto')
    const nonce = randomBytes(8).toString('hex')
    const expiredAt = Math.floor(Date.now() / 1000) - 1
    const payload = `${tripId}:${nonce}:${expiredAt}`
    const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET ?? 'test')
    hmac.update(payload)
    const sig = hmac.digest('base64url')
    const token = `${Buffer.from(payload).toString('base64url')}.${sig}`

    const result = verifySnapshotToken(token)
    expect(result?.expired).toBe(true)
  })

  it('each call generates unique token', () => {
    const t1 = generateSnapshotToken(tripId)
    const t2 = generateSnapshotToken(tripId)
    expect(t1).not.toBe(t2)
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 14 tests must pass before Phase 3E.

TEST 1 — Unit tests:
  npm run test
  All tests in __tests__/unit/dashboard/ pass

TEST 2 — Dashboard home loads:
  Login as demo operator (demo@boatcheckin.com)
  Navigate to /dashboard
  Greeting shows correct time of day
  Stats row shows 3 numbers
  No blank sections, no console errors

TEST 3 — Today's trip card shows (if trip exists):
  Create a trip dated today
  Dashboard home: navy trip card appears
  Shows correct boat name, time, capacity
  Progress bar at correct % (guests / maxGuests)
  "Download PDF" button visible
  "Copy reminder" button visible

TEST 4 — Live guest updates:
  Open dashboard in one browser tab
  Open trip link in incognito tab
  Register a guest in the incognito tab
  Dashboard tab: guest row appears within 2 seconds
  WITHOUT refreshing the dashboard page
  Progress bar updates automatically

TEST 5 — Guest approval workflow:
  Create trip with requiresApproval: true
  Register a guest
  Dashboard shows guest with "pending" amber row
  Click approve (✓ button)
  Guest row turns normal immediately
  Supabase: approval_status = 'approved'

TEST 6 — Guest removal:
  Remove a guest from trip detail page
  Guest disappears from list immediately
  Supabase: guest row has deleted_at set (not deleted)
  Guest count decreases

TEST 7 — Manifest PDF:
  Click "Manifest PDF" in action bar
  PDF downloads automatically
  Open PDF: correct boat name, date, time
  Guest list shows all registered guests
  Waiver status shows ✓ / ✗ correctly
  Emergency contacts NOT on page 1 (space)
  Add-on orders section shows ordered items
  BoatCheckin footer on every page
  File starts with %PDF-1 (valid PDF)

TEST 8 — Captain snapshot:
  Click "Share to captain" in action bar
  Loading state shows "Generating..."
  URL appears: boatcheckin.com/snapshot/[token]
  "Copy captain link" button appears
  Click copy: URL in clipboard
  Open URL in new incognito tab:
    Captain snapshot page loads (Phase 3E builds it)
    For now: not 404, shows placeholder

TEST 9 — WhatsApp message copy:
  Click "Copy WhatsApp message"
  Button shows "Copied!" checkmark
  Clipboard contains message with:
    Trip link (boatcheckin.com/trip/[slug])
    Trip code (*CODE*)
    Boat name

TEST 10 — Stats row accuracy:
  Manually count trips created this month
  Manually count addon orders total
  Dashboard stats should match database
  (allow 5min cache lag for stats)

TEST 11 — Ownership enforcement:
  Create operator A and operator B
  Create trip under operator A
  Log in as operator B
  Try: GET /api/dashboard/manifest/[tripA_id]
  EXPECTED: 404 (not operator B's trip)
  Try: GET /api/dashboard/trips/[tripA_id]
  EXPECTED: 404

TEST 12 — Empty states:
  New operator with no boats:
    Dashboard shows setup prompt with [Set up my boat →]
  Operator with boats but no trips:
    Dashboard shows "Create your first trip →"
  Trip detail with no guests:
    "No guests yet — share the link"

TEST 13 — Trip list accuracy:
  /dashboard/trips shows only this operator's trips
  Status filter works (upcoming / completed)
  Progress bar reflects actual guest count
  TripCard links to correct /dashboard/trips/[id]

TEST 14 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  No 'any' in new files
  No unused imports

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 14 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + change)
  3. All 14 test results: ✅ / ❌
  4. Realtime confirmation:
     - Supabase Realtime channel name
     - Latency observed in TEST 4 (approx ms)
  5. PDF confirmation:
     - File size of generated PDF (approx KB)
     - All expected sections present
  6. Any deviations from spec + why
  7. Total lines added across all files
```
