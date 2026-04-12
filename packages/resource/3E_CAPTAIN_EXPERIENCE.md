# BoatCheckin — Phase 3E Agent Instructions
# Captain Experience: Snapshot + Slide to Start + End Trip
# @3E_CAPTAIN_EXPERIENCE

---

## CONTEXT

This is the most legally consequential
code in BoatCheckin.

When the captain slides that button:
six things happen simultaneously:
  1. Trip status → 'active' in the database
  2. Buoy API fires → insurance activates
  3. All guests receive push notification
  4. Operator dashboard updates in real-time
  5. USCG departure logged with timestamp
  6. Redis lock released

None of these can happen twice.
None of these can be reversed.
The slider exists specifically to prevent
accidental activation.

Build this phase with more care than any
other. Every line has a legal reason.

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/08-PAYMENTS.md
@docs/agents/10-COMPLIANCE.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3E — Captain Experience.
Three screens: D1 (snapshot), D2 (start trip),
D3 (end trip). No captain login anywhere.
Everything accessed via signed tokens.

Phases 3A–3D are complete.
Snapshot token generation (Part 1C in 3D)
is already built. Build on top of it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — BUOY API LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Buoy API may not be approved yet.
Build the full integration with a stub
that degrades gracefully when no API key.

────────────────────────────────────────────
1A. Buoy API client (server-only)
────────────────────────────────────────────

Create: apps/web/lib/buoy/client.ts
import 'server-only'

import 'server-only'

export interface BuoyActivationParams {
  tripId: string
  operatorId: string
  guestCount: number
  boatType: string
  boatName: string
  marinaLat: number | null
  marinaLng: number | null
  tripDate: string
  durationHours: number
}

export interface BuoyPolicyResult {
  policyId: string
  policyNumber: string
  status: 'active' | 'pending' | 'failed'
  activatedAt: string
  coverageUntil: string
  premium?: number
}

export interface BuoyEndParams {
  policyId: string
  tripId: string
  endedAt: string
  actualDurationHours: number
}

// ── Activate per-trip policy ─────────────
export async function activateBuoyPolicy(
  params: BuoyActivationParams
): Promise<BuoyPolicyResult> {
  const apiKey = process.env.BUOY_API_KEY
  const apiUrl = process.env.BUOY_API_URL

  // Graceful stub when API not yet approved
  if (!apiKey || !apiUrl) {
    console.warn('[buoy] BUOY_API_KEY not set — using stub policy')
    return {
      policyId: `STUB-${params.tripId.slice(0, 8).toUpperCase()}`,
      policyNumber: `STUB-PENDING-APPROVAL`,
      status: 'pending',
      activatedAt: new Date().toISOString(),
      coverageUntil: new Date(
        Date.now() + params.durationHours * 3600000
      ).toISOString(),
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`${apiUrl}/v1/policies/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Request-ID': params.tripId,
      },
      body: JSON.stringify({
        external_reference: params.tripId,
        operator_reference: params.operatorId,
        passengers: params.guestCount,
        vessel_type: normaliseVesselType(params.boatType),
        vessel_name: params.boatName,
        location: params.marinaLat && params.marinaLng
          ? { lat: params.marinaLat, lng: params.marinaLng }
          : undefined,
        coverage_start: params.tripDate,
        duration_hours: params.durationHours,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[buoy] activation failed:', res.status, err)
      throw new Error(`Buoy API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      policyId: data.policy_id,
      policyNumber: data.policy_number,
      status: 'active',
      activatedAt: data.activated_at ?? new Date().toISOString(),
      coverageUntil: data.coverage_until,
      premium: data.premium_cents,
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[buoy] request timed out')
    } else {
      console.error('[buoy] activation error:', err.message)
    }
    // Fail gracefully — trip still starts, insurance
    // activation logged as failed for manual follow-up
    return {
      policyId: `FAILED-${params.tripId.slice(0, 8)}`,
      policyNumber: 'ACTIVATION-FAILED',
      status: 'failed',
      activatedAt: new Date().toISOString(),
      coverageUntil: '',
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── End / deactivate policy ──────────────
export async function endBuoyPolicy(
  params: BuoyEndParams
): Promise<void> {
  const apiKey = process.env.BUOY_API_KEY
  const apiUrl = process.env.BUOY_API_URL

  if (!apiKey || !apiUrl) return // stub — silent

  if (params.policyId.startsWith('STUB-') ||
      params.policyId.startsWith('FAILED-')) {
    return // not a real policy
  }

  try {
    await fetch(`${apiUrl}/v1/policies/${params.policyId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip_reference: params.tripId,
        ended_at: params.endedAt,
        actual_duration_hours: params.actualDurationHours,
      }),
    })
  } catch (err) {
    console.error('[buoy] end policy error:', err)
    // Non-critical — log for manual follow-up
  }
}

// Normalise boat type to Buoy API format
function normaliseVesselType(type: string): string {
  const map: Record<string, string> = {
    motor_yacht: 'motor_vessel',
    sailing_yacht: 'sailing_vessel',
    catamaran: 'catamaran',
    fishing_charter: 'fishing_vessel',
    pontoon: 'pontoon_boat',
    speedboat: 'motorboat',
    snorkel_dive: 'dive_vessel',
    sunset_cruise: 'excursion_vessel',
    other: 'other',
  }
  return map[type] ?? 'other'
}

────────────────────────────────────────────
1B. Push notification helper (server-only)
────────────────────────────────────────────

Create: apps/web/lib/notifications/push.ts
import 'server-only'

import 'server-only'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

// Init VAPID (idempotent — safe to call repeatedly)
let vapidInitialised = false
function initVapid() {
  if (vapidInitialised) return
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privKey = process.env.VAPID_PRIVATE_KEY
  if (!pubKey || !privKey) return
  webpush.setVapidDetails(
    'mailto:hello@boatcheckin.com',
    pubKey,
    privKey
  )
  vapidInitialised = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string        // Replaces previous notification with same tag
}

// Send push to a single subscription
export async function sendPush(
  subscription: PushSubscription | object,
  payload: PushPayload
): Promise<void> {
  initVapid()
  if (!vapidInitialised) {
    console.warn('[push] VAPID keys not set — skipping push')
    return
  }

  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: payload.tag,
        data: { url: payload.url ?? '/' },
      })
    )
  } catch (err: any) {
    // 410 Gone = subscription expired
    // 404 Not Found = invalid subscription
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Mark subscription as invalid in DB (non-blocking)
      removeExpiredPushSubscription(subscription).catch(() => null)
    }
    // Never throw — push failure is non-critical
  }
}

// Send push to ALL guests on a trip
export async function sendPushToAllGuests(
  tripId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = createServiceClient()

  const { data: guests } = await supabase
    .from('guests')
    .select('id, push_subscription')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .not('push_subscription', 'is', null)

  if (!guests || guests.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    guests.map(async guest => {
      if (!guest.push_subscription) return
      try {
        await sendPush(guest.push_subscription, payload)
        sent++
      } catch {
        failed++
      }
    })
  )

  return { sent, failed }
}

async function removeExpiredPushSubscription(
  subscription: object
): Promise<void> {
  const supabase = createServiceClient()
  // Find and clear the subscription from the guest record
  await supabase
    .from('guests')
    .update({ push_subscription: null })
    .eq('push_subscription', subscription)
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — TRIP LIFECYCLE API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. POST /api/trips/[slug]/start
    The most important route in BoatCheckin
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/
  start/route.ts
import 'server-only'

No auth required — captain uses snapshot token.
Token validated via query param.

THE ARCHITECTURE OF THIS ROUTE:

Every action is wrapped in try/catch.
A failed Buoy call must NEVER stop the trip
from starting — operators must not be blocked
by a third-party API on departure day.

The Redis lock is the ONLY synchronisation
mechanism preventing double-start. The DB
status check is a second line of defence.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { getRedis } from '@/lib/redis/upstash'
import { activateBuoyPolicy } from '@/lib/buoy/client'
import { sendPushToAllGuests } from '@/lib/notifications/push'
import { auditLog } from '@/lib/security/audit'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

const startSchema = z.object({
  snapshotToken: z.string().min(10),
  captainName: z.string().max(100).optional(),
  confirmedGuestCount: z.number().int().min(0),
  checklistConfirmed: z.boolean().refine(
    v => v === true,
    { message: 'Pre-departure checklist must be confirmed' }
  ),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // ── Rate limit: 5 start attempts per hour per IP
  const limited = await rateLimit(req, {
    max: 5, window: 3600,
    key: `trip:start:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ── Parse and validate body ──────────────
  const body = await req.json().catch(() => null)
  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // ── Verify snapshot token ────────────────
  const tokenResult = verifySnapshotToken(data.snapshotToken)
  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Invalid or tampered token' },
      { status: 401 }
    )
  }
  if (tokenResult.expired) {
    return NextResponse.json(
      { error: 'This link has expired. Ask the operator to send a new one.' },
      { status: 401 }
    )
  }

  const tripId = tokenResult.tripId
  const supabase = createServiceClient()

  // ── Fetch trip to verify slug matches token ──
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select(`
      id, slug, status, trip_date, departure_time,
      duration_hours, max_guests, operator_id,
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, lat, lng, captain_name
      )
    `)
    .eq('id', tripId)
    .eq('slug', slug)
    .single()

  if (tripErr || !trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    )
  }

  // ── Already active — idempotent ──────────
  if (trip.status === 'active') {
    const { data: existing } = await supabase
      .from('trips')
      .select('started_at, buoy_policy_id, guest_count_at_start')
      .eq('id', tripId)
      .single()

    return NextResponse.json({
      data: {
        alreadyStarted: true,
        startedAt: existing?.started_at,
        buoyPolicyId: existing?.buoy_policy_id,
      },
    })
  }

  // ── Trip must be upcoming to start ───────
  if (trip.status !== 'upcoming') {
    return NextResponse.json(
      { error: `Cannot start a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  // ── Acquire Redis distributed lock ───────
  // Prevents two simultaneous start requests
  const redis = getRedis()
  const lockKey = `lock:trip:start:${tripId}`

  const acquired = await redis.set(
    lockKey,
    '1',
    { ex: 30, nx: true }    // Only set if NOT exists
  ).catch(() => null)

  if (!acquired) {
    // Lock exists — another start is in progress
    return NextResponse.json(
      { error: 'Trip start already in progress. Please wait.' },
      { status: 409 }
    )
  }

  const startedAt = new Date().toISOString()
  const boat = trip.boats as any

  try {
    // ── STEP 1: Update trip status ───────────
    // This is the source of truth — do first
    const { error: updateErr } = await supabase
      .from('trips')
      .update({
        status: 'active',
        started_at: startedAt,
        started_by_captain: data.captainName
          ?? boat?.captain_name
          ?? 'Captain',
        guest_count_at_start: data.confirmedGuestCount,
      })
      .eq('id', tripId)
      .eq('status', 'upcoming') // Extra safety: only update if still upcoming

    if (updateErr) {
      throw new Error(`DB update failed: ${updateErr.message}`)
    }

    // ── STEP 2: Buoy API (non-blocking on failure) ──
    let buoyResult = null
    try {
      buoyResult = await activateBuoyPolicy({
        tripId,
        operatorId: trip.operator_id,
        guestCount: data.confirmedGuestCount,
        boatType: boat?.boat_type ?? 'other',
        boatName: boat?.boat_name ?? 'Unknown',
        marinaLat: boat?.lat ? Number(boat.lat) : null,
        marinaLng: boat?.lng ? Number(boat.lng) : null,
        tripDate: trip.trip_date,
        durationHours: trip.duration_hours,
      })

      // Save policy ID
      if (buoyResult.policyId) {
        await supabase
          .from('trips')
          .update({ buoy_policy_id: buoyResult.policyId })
          .eq('id', tripId)
      }
    } catch (buoyErr) {
      // Buoy failure NEVER blocks trip start
      console.error('[start] Buoy API failed:', buoyErr)
      // Log for manual follow-up
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'buoy_activation_failed',
        title: 'Insurance activation needs attention',
        body: 'Buoy API could not activate automatically. Contact support.',
        data: { tripId },
      }).catch(() => null)
    }

    // ── STEP 3: Audit log (USCG departure record) ──
    await auditLog({
      action: 'trip_started',
      operatorId: trip.operator_id,
      entityType: 'trip',
      entityId: tripId,
      changes: {
        startedAt,
        guestCount: data.confirmedGuestCount,
        captainName: data.captainName,
        buoyPolicyId: buoyResult?.policyId ?? null,
        buoyPolicyNumber: buoyResult?.policyNumber ?? null,
        marinaName: boat?.marina_name,
        lat: boat?.lat,
        lng: boat?.lng,
      },
    })

    // ── STEP 4: Push to all guests (non-blocking) ──
    sendPushToAllGuests(tripId, {
      title: `⚓ Your charter has started!`,
      body: `Welcome aboard ${boat?.boat_name ?? 'your charter'}. Have an amazing trip!`,
      icon: '/icons/icon-192.png',
      url: `/trip/${slug}`,
      tag: `trip-started-${tripId}`,
    }).catch(() => null)

    // ── STEP 5: Notify operator dashboard ───
    // Supabase Realtime broadcasts to dashboard
    await supabase.from('operator_notifications').insert({
      operator_id: trip.operator_id,
      type: 'trip_started',
      title: '⚓ Trip started',
      body: `${boat?.boat_name} has departed with ${data.confirmedGuestCount} guests`,
      data: { tripId, slug: trip.slug },
    }).catch(() => null)

    return NextResponse.json({
      data: {
        started: true,
        startedAt,
        buoyPolicyId: buoyResult?.policyId ?? null,
        buoyPolicyNumber: buoyResult?.policyNumber ?? null,
        buoyStatus: buoyResult?.status ?? 'unknown',
      },
    })

  } catch (err: any) {
    console.error('[trip:start] critical error:', err.message)

    // Attempt to roll back if DB update caused the error
    await supabase
      .from('trips')
      .update({ status: 'upcoming', started_at: null })
      .eq('id', tripId)
      .eq('started_at', startedAt)
      .catch(() => null)

    return NextResponse.json(
      { error: 'Failed to start trip. Please try again.' },
      { status: 500 }
    )
  } finally {
    // ALWAYS release lock
    await redis.del(lockKey).catch(() => null)
  }
}

────────────────────────────────────────────
2B. POST /api/trips/[slug]/end
    End trip, trigger post-trip flows
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/
  end/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { rateLimit } from '@/lib/security/rate-limit'
import { endBuoyPolicy } from '@/lib/buoy/client'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const endSchema = z.object({
  snapshotToken: z.string().min(10),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, {
    max: 5, window: 3600,
    key: `trip:end:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = endSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request' }, { status: 400 }
    )
  }

  // Verify token
  const tokenResult = verifySnapshotToken(parsed.data.snapshotToken)
  if (!tokenResult || tokenResult.expired) {
    return NextResponse.json(
      { error: 'Invalid or expired token' }, { status: 401 }
    )
  }

  const tripId = tokenResult.tripId
  const supabase = createServiceClient()

  // Fetch active trip
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, status, started_at, duration_hours,
      max_guests, operator_id, buoy_policy_id,
      boats ( boat_name )
    `)
    .eq('id', tripId)
    .eq('slug', slug)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  // Idempotent: already completed
  if (trip.status === 'completed') {
    return NextResponse.json({
      data: { alreadyEnded: true }
    })
  }

  if (trip.status !== 'active') {
    return NextResponse.json(
      { error: `Cannot end a trip with status: ${trip.status}` },
      { status: 409 }
    )
  }

  const endedAt = new Date().toISOString()

  // Calculate actual duration
  let actualHours = trip.duration_hours
  if (trip.started_at) {
    const startMs = new Date(trip.started_at).getTime()
    actualHours = (Date.now() - startMs) / 3600000
  }

  // ── Update trip to completed ─────────────
  const { error: updateErr } = await supabase
    .from('trips')
    .update({
      status: 'completed',
      ended_at: endedAt,
    })
    .eq('id', tripId)
    .eq('status', 'active')

  if (updateErr) {
    return NextResponse.json(
      { error: 'Failed to end trip' }, { status: 500 }
    )
  }

  // ── End Buoy policy (non-blocking) ───────
  if (trip.buoy_policy_id) {
    endBuoyPolicy({
      policyId: trip.buoy_policy_id,
      tripId,
      endedAt,
      actualDurationHours: actualHours,
    }).catch(() => null)
  }

  // ── Audit log ────────────────────────────
  auditLog({
    action: 'trip_ended',
    operatorId: trip.operator_id,
    entityType: 'trip',
    entityId: tripId,
    changes: {
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
      buoyPolicyId: trip.buoy_policy_id,
    },
  }).catch(() => null)

  // ── Notify operator ──────────────────────
  supabase.from('operator_notifications').insert({
    operator_id: trip.operator_id,
    type: 'trip_ended',
    title: '✓ Trip completed',
    body: `${(trip.boats as any)?.boat_name} has returned`,
    data: { tripId },
  }).then().catch(() => null)

  return NextResponse.json({
    data: {
      ended: true,
      endedAt,
      actualHours: Math.round(actualHours * 10) / 10,
    },
  })
}

────────────────────────────────────────────
2C. GET /api/snapshot/[token]
    Fetch snapshot data for captain page
────────────────────────────────────────────

Create: apps/web/app/api/snapshot/[token]/
  route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { getRedis } from '@/lib/redis/upstash'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { shapeTripDetail, buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import type { CaptainSnapshotData } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Rate limit: 60/min per IP
  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `snapshot:view`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' }, { status: 429 }
    )
  }

  // Verify token
  const tokenResult = verifySnapshotToken(token)
  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Invalid token' }, { status: 401 }
    )
  }
  if (tokenResult.expired) {
    return NextResponse.json(
      { error: 'expired' }, { status: 401 }
    )
  }

  const tripId = tokenResult.tripId

  // Check Redis cache (1min TTL)
  const redis = getRedis()
  const cacheKey = `cache:snapshot:${token}`
  try {
    const cached = await redis.get<CaptainSnapshotData>(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached })
    }
  } catch {}

  // Fetch live from DB
  const supabase = createServiceClient()
  const { data: raw } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, status, started_at,
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
    .eq('id', tripId)
    .is('guests.deleted_at', null)
    .single()

  if (!raw) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  const trip = shapeTripDetail(raw)
  const alerts = buildCaptainAlerts(trip.guests)
  const addonSummary = buildAddonSummary(trip.guests)

  const snapshot: CaptainSnapshotData = {
    tripId,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    marinaName: trip.boat.marinaName,
    slipNumber: trip.boat.slipNumber,
    tripDate: trip.tripDate,
    departureTime: trip.departureTime,
    durationHours: trip.durationHours,
    captainName: trip.boat.captainName,
    weather: null,
    alerts,
    guests: trip.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      waiverSigned: g.waiverSigned,
      languageFlag: LANGUAGE_FLAGS[g.languagePreference as any] ?? '🌐',
      addonEmojis: g.addonOrders.map(o => o.emoji),
    })),
    addonSummary,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }

  // Cache 1 min
  redis.set(cacheKey, snapshot, { ex: 60 }).catch(() => null)

  return NextResponse.json({ data: snapshot })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — SNAPSHOT PAGE (D1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
3A. Snapshot page route
────────────────────────────────────────────

Create: apps/web/app/(public)/snapshot/
  [token]/page.tsx

Server Component. No auth.
Validates token server-side.
Passes snapshot data to client.

import { notFound } from 'next/navigation'
import { verifySnapshotToken } from '@/lib/security/snapshot'
import { getRedis } from '@/lib/redis/upstash'
import { createServiceClient } from '@/lib/supabase/service'
import { shapeTripDetail, buildAddonSummary, buildCaptainAlerts } from '@/lib/dashboard/getDashboardData'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { CaptainSnapshotView } from '@/components/captain/CaptainSnapshotView'
import type { Metadata } from 'next'
import type { CaptainSnapshotData } from '@/types'

export const metadata: Metadata = {
  title: 'Captain Snapshot — BoatCheckin',
  robots: { index: false },  // Never index captain pages
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Verify token
  const result = verifySnapshotToken(token)

  if (!result) {
    return <TokenInvalidPage />
  }
  if (result.expired) {
    return <TokenExpiredPage />
  }

  const tripId = result.tripId
  const supabase = createServiceClient()

  // Fetch full trip for snapshot
  const { data: raw } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      max_guests, status, started_at, buoy_policy_id,
      boats (
        id, boat_name, boat_type, marina_name, slip_number,
        captain_name, lat, lng, waiver_text, safety_points,
        captain_photo_url
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
    .eq('id', tripId)
    .is('guests.deleted_at', null)
    .single()

  if (!raw) notFound()

  const trip = shapeTripDetail(raw)
  const boat = raw.boats as any

  // Fetch weather for trip date
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(
        Number(boat.lat),
        Number(boat.lng),
        trip.tripDate
      )
    : null

  const alerts = buildCaptainAlerts(trip.guests)
  const addonSummary = buildAddonSummary(trip.guests)

  const snapshot: CaptainSnapshotData = {
    tripId,
    slug: trip.slug,
    boatName: trip.boat.boatName,
    marinaName: trip.boat.marinaName,
    slipNumber: trip.boat.slipNumber,
    tripDate: trip.tripDate,
    departureTime: trip.departureTime,
    durationHours: trip.durationHours,
    captainName: trip.boat.captainName,
    weather: weather ? {
      label: weather.label,
      temperature: weather.temperature,
      icon: weather.icon,
    } : null,
    alerts,
    guests: trip.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      waiverSigned: g.waiverSigned,
      languageFlag: LANGUAGE_FLAGS[g.languagePreference as any] ?? '🌐',
      addonEmojis: g.addonOrders.map(o => o.emoji),
    })),
    addonSummary,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }

  return (
    <CaptainSnapshotView
      snapshot={snapshot}
      token={token}
      tripStatus={trip.status}
      startedAt={trip.startedAt}
      buoyPolicyId={(raw as any).buoy_policy_id ?? null}
    />
  )
}

function TokenInvalidPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-[48px] mb-4">🔒</div>
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Invalid link
        </h1>
        <p className="text-[15px] text-[#6B7C93]">
          This captain link is invalid or has been tampered with.
          Ask the operator for a new link.
        </p>
      </div>
    </div>
  )
}

function TokenExpiredPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-[48px] mb-4">⏰</div>
        <h1 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Link expired
        </h1>
        <p className="text-[15px] text-[#6B7C93]">
          Captain links expire after 1 hour.
          Ask the operator to share a fresh link.
        </p>
      </div>
    </div>
  )
}

────────────────────────────────────────────
3B. CaptainSnapshotView (client component)
────────────────────────────────────────────

Create: apps/web/components/captain/
  CaptainSnapshotView.tsx
'use client'

Handles auto-refresh + shows all snapshot
sections. Switches to StartTrip flow
when captain taps "Slide to Start".

'use client'

import { useState, useEffect } from 'react'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { SnapshotAlerts } from './SnapshotAlerts'
import { SnapshotGuestList } from './SnapshotGuestList'
import { SnapshotAddonSummary } from './SnapshotAddonSummary'
import { StartTripFlow } from './StartTripFlow'
import { EndTripFlow } from './EndTripFlow'
import type { CaptainSnapshotData, TripStatus } from '@/types'

interface CaptainSnapshotViewProps {
  snapshot: CaptainSnapshotData
  token: string
  tripStatus: TripStatus
  startedAt: string | null
  buoyPolicyId: string | null
}

export function CaptainSnapshotView({
  snapshot, token, tripStatus, startedAt, buoyPolicyId,
}: CaptainSnapshotViewProps) {
  const [status, setStatus] = useState<TripStatus>(tripStatus)
  const [startedAtState, setStartedAt] = useState(startedAt)
  const [policyId, setPolicyId] = useState(buoyPolicyId)
  const [showStartFlow, setShowStartFlow] = useState(false)
  const [showEndFlow, setShowEndFlow] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState(snapshot)

  // Auto-refresh every 60 seconds for live guest updates
  useEffect(() => {
    if (status !== 'upcoming') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/snapshot/${token}`)
        if (res.ok) {
          const json = await res.json()
          setLiveSnapshot(json.data)
        }
      } catch {}
    }, 60000)
    return () => clearInterval(interval)
  }, [token, status])

  function onTripStarted(result: {
    startedAt: string
    buoyPolicyId: string | null
  }) {
    setStatus('active')
    setStartedAt(result.startedAt)
    setPolicyId(result.buoyPolicyId)
    setShowStartFlow(false)
  }

  function onTripEnded() {
    setStatus('completed')
    setShowEndFlow(false)
  }

  // Show start flow overlay
  if (showStartFlow) {
    return (
      <StartTripFlow
        snapshot={liveSnapshot}
        token={token}
        onStarted={onTripStarted}
        onCancel={() => setShowStartFlow(false)}
      />
    )
  }

  // Show end flow overlay
  if (showEndFlow) {
    return (
      <EndTripFlow
        boatName={liveSnapshot.boatName}
        startedAt={startedAtState}
        token={token}
        tripSlug={liveSnapshot.slug}
        onEnded={onTripEnded}
        onCancel={() => setShowEndFlow(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC]">

      {/* Header */}
      <div className="bg-[#0C447C] px-5 pt-5 pb-6 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-bold tracking-wider opacity-70">
            CAPTAIN VIEW · DOCKPASS
          </span>
          <span className={
            status === 'active'
              ? 'text-[12px] font-bold bg-[#1D9E75] px-2.5 py-1 rounded-full'
              : 'text-[12px] font-bold bg-white/20 px-2.5 py-1 rounded-full'
          }>
            {status === 'active' ? '● Active' : 'Upcoming'}
          </span>
        </div>
        <h1 className="text-[24px] font-bold mb-1">
          {liveSnapshot.boatName}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            `📅 ${formatTripDate(liveSnapshot.tripDate)}`,
            `⏰ ${formatTime(liveSnapshot.departureTime)}`,
            `⏳ ${formatDuration(liveSnapshot.durationHours)}`,
          ].map(chip => (
            <span key={chip} className="bg-white/20 text-white text-[12px] px-3 py-1 rounded-full">
              {chip}
            </span>
          ))}
        </div>
        <p className="text-white/70 text-[13px] mt-2">
          📍 {liveSnapshot.marinaName}
          {liveSnapshot.slipNumber ? ` · Slip ${liveSnapshot.slipNumber}` : ''}
        </p>

        {/* Weather */}
        {liveSnapshot.weather && (
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-[10px] px-3 py-2">
            <span className="text-[20px]">{liveSnapshot.weather.icon}</span>
            <span className="text-[13px] font-medium">
              {liveSnapshot.weather.label} · {liveSnapshot.weather.temperature}°F
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">

        {/* Buoy insurance status */}
        {status === 'active' && (
          <div className="p-4 rounded-[16px] bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">🟢</span>
              <div>
                <p className="text-[14px] font-semibold text-[#1D9E75]">
                  Insurance active
                </p>
                {policyId && !policyId.startsWith('STUB') && !policyId.startsWith('FAIL') && (
                  <p className="text-[12px] text-[#6B7C93]">
                    Policy: {policyId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Passenger alerts */}
        <SnapshotAlerts alerts={liveSnapshot.alerts} />

        {/* Guest list */}
        <SnapshotGuestList
          guests={liveSnapshot.guests}
          maxGuests={snapshot.guests.length}
        />

        {/* Add-on summary */}
        {liveSnapshot.addonSummary.length > 0 && (
          <SnapshotAddonSummary summary={liveSnapshot.addonSummary} />
        )}

        {/* Refresh indicator */}
        {status === 'upcoming' && (
          <p className="text-[11px] text-[#6B7C93] text-center">
            Auto-refreshes every 60 seconds
          </p>
        )}

        {/* Bottom action button */}
        <div className="pt-2 pb-8">
          {status === 'upcoming' && (
            <button
              onClick={() => setShowStartFlow(true)}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#1D9E75] text-white
                font-bold text-[18px]
                hover:bg-[#178a64] transition-colors
                active:scale-[0.98]
              "
            >
              ⚓ Slide to Start Trip →
            </button>
          )}

          {status === 'active' && (
            <button
              onClick={() => setShowEndFlow(true)}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#E8593C] text-white
                font-bold text-[18px]
                hover:bg-[#cc4a32] transition-colors
              "
            >
              End Trip →
            </button>
          )}

          {status === 'completed' && (
            <div className="
              w-full h-[64px] rounded-[16px]
              bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30
              flex items-center justify-center
            ">
              <span className="text-[16px] font-semibold text-[#1D9E75]">
                ✓ Trip completed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — SNAPSHOT SECTION COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All in: apps/web/components/captain/

────────────────────────────────────────────
4A. SnapshotAlerts
────────────────────────────────────────────

Create: apps/web/components/captain/
  SnapshotAlerts.tsx
(Server-compatible — no hooks)

import { cn } from '@/lib/utils'

interface Alerts {
  nonSwimmers: number
  children: number
  seasicknessProne: number
  dietary: { name: string; requirement: string }[]
}

export function SnapshotAlerts({ alerts }: { alerts: Alerts }) {
  const hasAlerts =
    alerts.nonSwimmers > 0 ||
    alerts.seasicknessProne > 0 ||
    alerts.dietary.length > 0

  if (!hasAlerts) return null

  return (
    <div className="
      bg-[#FDEAEA] rounded-[16px] p-4
      border border-[#E8593C] border-opacity-20
    ">
      <p className="text-[13px] font-bold text-[#E8593C] mb-3 uppercase tracking-wide">
        ⚠️ Passenger alerts
      </p>
      <div className="space-y-2">
        {alerts.nonSwimmers > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🏊</span>
            <span className="text-[14px] font-medium text-[#0D1B2A]">
              {alerts.nonSwimmers} non-swimmer{alerts.nonSwimmers !== 1 ? 's' : ''}
              {' '}— life jacket required at all times
            </span>
          </div>
        )}
        {alerts.seasicknessProne > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[18px]">💊</span>
            <span className="text-[14px] font-medium text-[#0D1B2A]">
              {alerts.seasicknessProne} seasickness prone
            </span>
          </div>
        )}
        {alerts.dietary.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[18px]">🥜</span>
            <span className="text-[14px] text-[#0D1B2A]">
              <strong>{d.name}:</strong> {d.requirement}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

────────────────────────────────────────────
4B. SnapshotGuestList
────────────────────────────────────────────

Create: apps/web/components/captain/
  SnapshotGuestList.tsx

interface GuestRow {
  id: string
  fullName: string
  waiverSigned: boolean
  languageFlag: string
  addonEmojis: string[]
}

export function SnapshotGuestList({
  guests, maxGuests,
}: {
  guests: GuestRow[]
  maxGuests: number
}) {
  const signed = guests.filter(g => g.waiverSigned).length

  return (
    <div className="
      bg-white rounded-[20px] overflow-hidden
      border border-[#D0E2F3]
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Passengers
          </h2>
          <span className="text-[14px] font-bold text-[#0C447C]">
            {guests.length} checked in · {signed} signed
          </span>
        </div>
      </div>

      {/* Guest rows */}
      {guests.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[15px] text-[#6B7C93]">No guests yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F8FC]">
          {guests.map(guest => (
            <div
              key={guest.id}
              className={
                guest.waiverSigned
                  ? 'px-5 py-3 flex items-center gap-3'
                  : 'px-5 py-3 flex items-center gap-3 bg-[#FEF9EE]'
              }
            >
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

              {/* Name */}
              <span className="flex-1 text-[14px] font-medium text-[#0D1B2A] truncate">
                {guest.fullName}
              </span>

              {/* Language + addons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[14px]">{guest.languageFlag}</span>
                {guest.addonEmojis.length > 0 && (
                  <span className="text-[13px]">
                    {guest.addonEmojis.join('')}
                  </span>
                )}
                <span className={
                  guest.waiverSigned
                    ? 'text-[12px] font-bold text-[#1D9E75]'
                    : 'text-[12px] font-bold text-[#E5910A]'
                }>
                  {guest.waiverSigned ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

────────────────────────────────────────────
4C. SnapshotAddonSummary
────────────────────────────────────────────

Create: apps/web/components/captain/
  SnapshotAddonSummary.tsx

import { formatCurrency } from '@/lib/utils/format'
import type { AddonSummaryItem } from '@/types'

export function SnapshotAddonSummary({
  summary,
}: {
  summary: AddonSummaryItem[]
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          Add-ons to prepare
        </h2>
      </div>
      <div className="divide-y divide-[#F5F8FC]">
        {summary.map(item => (
          <div key={item.addonName} className="px-5 py-3.5 flex items-center gap-3">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[#0D1B2A]">
                {item.addonName} × {item.totalQty}
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[13px] font-bold text-[#0C447C]">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — SLIDE TO START TRIP (D2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. StartTripFlow — the most important screen
────────────────────────────────────────────

Create: apps/web/components/captain/
  StartTripFlow.tsx
'use client'

Full-screen overlay. Pre-departure checklist
+ unsigned waiver warning + slider + confirm.

'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils'
import { formatTripDate, formatTime } from '@/lib/utils/format'
import type { CaptainSnapshotData } from '@/types'

interface StartTripFlowProps {
  snapshot: CaptainSnapshotData
  token: string
  onStarted: (result: { startedAt: string; buoyPolicyId: string | null }) => void
  onCancel: () => void
}

const CHECKLIST_ITEMS = [
  { id: 'guests', label: 'All guests accounted for' },
  { id: 'safety', label: 'Safety briefing given to all passengers' },
  { id: 'jackets', label: 'Life jackets accessible and located' },
  { id: 'weather', label: 'Weather conditions are acceptable' },
  { id: 'manifest', label: 'Passenger manifest downloaded or accessible' },
] as const

type ChecklistId = typeof CHECKLIST_ITEMS[number]['id']

export function StartTripFlow({
  snapshot, token, onStarted, onCancel,
}: StartTripFlowProps) {
  const [checked, setChecked] = useState<Set<ChecklistId>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [sliderComplete, setSliderComplete] = useState(false)

  const unsignedGuests = snapshot.guests.filter(g => !g.waiverSigned)
  const allChecked = checked.size === CHECKLIST_ITEMS.length

  function toggleCheck(id: ChecklistId) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSliderComplete() {
    if (!allChecked) return
    setSliderComplete(true)
    setShowConfirm(true)
  }

  async function confirmStart() {
    setIsStarting(true)
    setStartError('')

    try {
      const res = await fetch(
        `/api/trips/${snapshot.slug}/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshotToken: token,
            captainName: snapshot.captainName,
            confirmedGuestCount: snapshot.guests.length,
            checklistConfirmed: true,
          }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        setStartError(json.error ?? 'Failed to start trip')
        setSliderComplete(false)
        setShowConfirm(false)
        return
      }

      onStarted({
        startedAt: json.data.startedAt,
        buoyPolicyId: json.data.buoyPolicyId,
      })

    } catch {
      setStartError('Connection error. Please try again.')
      setSliderComplete(false)
      setShowConfirm(false)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="bg-[#1D9E75] px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white text-[14px]"
          >
            ← Back
          </button>
          <span className="text-[13px] font-bold tracking-wider opacity-70">
            PRE-DEPARTURE
          </span>
        </div>
        <h1 className="text-[24px] font-bold">Ready to depart?</h1>
        <p className="text-white/80 text-[14px] mt-1">
          {snapshot.boatName} · {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Unsigned waiver warning */}
        {unsignedGuests.length > 0 && (
          <div className="p-4 bg-[#FEF3DC] rounded-[16px] border border-[#E5910A] border-opacity-30">
            <p className="text-[14px] font-semibold text-[#E5910A] mb-2">
              ⚠️ {unsignedGuests.length} guest{unsignedGuests.length !== 1 ? 's' : ''} has not signed the waiver
            </p>
            <div className="space-y-1">
              {unsignedGuests.map(g => (
                <p key={g.id} className="text-[13px] text-[#0D1B2A]">
                  · {g.fullName}
                </p>
              ))}
            </div>
            <p className="text-[12px] text-[#6B7C93] mt-2">
              You may still proceed. Record this in your log.
            </p>
          </div>
        )}

        {/* Pre-departure checklist */}
        <div className="bg-[#F5F8FC] rounded-[20px] p-5">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A] mb-4">
            Pre-departure checklist
          </h2>
          <p className="text-[13px] text-[#6B7C93] mb-4">
            Confirm each item before sliding to start.
          </p>
          <div className="space-y-1">
            {CHECKLIST_ITEMS.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 py-3 cursor-pointer min-h-[48px]
                           border-b border-[#D0E2F3] last:border-0"
              >
                <div
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    'w-6 h-6 rounded-[6px] border-2 flex items-center justify-center',
                    'transition-all duration-150 flex-shrink-0',
                    checked.has(item.id)
                      ? 'bg-[#1D9E75] border-[#1D9E75]'
                      : 'bg-white border-[#D0E2F3]'
                  )}
                >
                  {checked.has(item.id) && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  'text-[15px] leading-tight',
                  checked.has(item.id)
                    ? 'text-[#6B7C93] line-through'
                    : 'text-[#0D1B2A]'
                )}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-[#6B7C93]">
              {checked.size} / {CHECKLIST_ITEMS.length} confirmed
            </span>
            {allChecked && (
              <span className="text-[13px] font-semibold text-[#1D9E75]">
                ✓ All confirmed
              </span>
            )}
          </div>
        </div>

        {/* Guest count */}
        <div className="bg-[#E8F2FB] rounded-[16px] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[#0D1B2A]">
              Passengers on board
            </p>
            <span className="text-[22px] font-black text-[#0C447C]">
              {snapshot.guests.length}
            </span>
          </div>
        </div>

        {/* Error */}
        {startError && (
          <div className="p-4 bg-[#FDEAEA] rounded-[12px]">
            <p className="text-[14px] text-[#D63B3B] font-medium">
              {startError}
            </p>
          </div>
        )}
      </div>

      {/* Slider CTA */}
      <div className="px-5 pb-10 pt-4 bg-white border-t border-[#D0E2F3]">
        {allChecked ? (
          <SlideToConfirm
            label="SLIDE TO START TRIP"
            onComplete={handleSliderComplete}
            disabled={isStarting}
            color="teal"
          />
        ) : (
          <div className="
            w-full h-[64px] rounded-[16px]
            bg-[#D0E2F3] flex items-center justify-center
          ">
            <span className="text-[15px] font-semibold text-[#6B7C93]">
              Complete checklist to continue
            </span>
          </div>
        )}
      </div>

      {/* Confirmation overlay */}
      {showConfirm && (
        <div className="
          fixed inset-0 z-50 bg-[rgba(12,68,124,0.5)]
          flex items-end
        ">
          <div className="
            w-full bg-white rounded-t-[24px]
            px-6 py-6 pb-10
          ">
            <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-5" />

            <h2 className="text-[22px] font-bold text-[#0D1B2A] mb-2">
              Starting trip
            </h2>
            <p className="text-[15px] text-[#6B7C93] mb-1">
              {snapshot.boatName}
            </p>
            <p className="text-[14px] text-[#6B7C93] mb-5">
              {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)} · {snapshot.guests.length} passengers
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-[13px] text-[#6B7C93]">
                <span>✓</span>
                <span>Trip status set to Active</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-[#6B7C93]">
                <span>✓</span>
                <span>Insurance policy activated via Buoy API</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-[#6B7C93]">
                <span>✓</span>
                <span>Departure timestamp logged (USCG)</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-[#6B7C93]">
                <span>✓</span>
                <span>Guests notified on their phones</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setSliderComplete(false)
                }}
                disabled={isStarting}
                className="
                  flex-1 h-[56px] rounded-[12px]
                  border border-[#D0E2F3] text-[#6B7C93]
                  font-semibold text-[15px]
                  hover:bg-[#F5F8FC] transition-colors
                  disabled:opacity-40
                "
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                disabled={isStarting}
                className="
                  flex-1 h-[56px] rounded-[12px]
                  bg-[#1D9E75] text-white
                  font-bold text-[16px]
                  flex items-center justify-center gap-2
                  hover:bg-[#178a64] transition-colors
                  disabled:opacity-40
                "
              >
                {isStarting ? (
                  <AnchorLoader size="sm" color="white" />
                ) : (
                  '⚓ Start now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — SLIDE TO CONFIRM COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
6A. SlideToConfirm — the physical slider
────────────────────────────────────────────

Create: apps/web/components/ui/
  SlideToConfirm.tsx
'use client'

This component is the key interaction that
prevents accidental trips starting.
Must reach 85%+ drag before triggering.
Haptic feedback on mobile on complete.
Resets if released before complete.

'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SlideToConfirmProps {
  label: string
  onComplete: () => void
  disabled?: boolean
  color: 'teal' | 'coral'
}

export function SlideToConfirm({
  label, onComplete, disabled = false, color,
}: SlideToConfirmProps) {
  const [complete, setComplete] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [trackWidth, setTrackWidth] = useState(0)

  const THUMB_SIZE = 60
  const COMPLETE_THRESHOLD = 0.85 // 85% of track

  const bgColor = color === 'teal' ? '#1D9E75' : '#E8593C'
  const bgColorLight = color === 'teal' ? '#E8F9F4' : '#FDEAEA'
  const textColor = color === 'teal' ? '#1D9E75' : '#E8593C'

  function handleDragEnd(_: any, info: PanInfo) {
    if (disabled || complete) return
    const maxX = trackWidth - THUMB_SIZE - 8
    const progress = x.get() / maxX

    if (progress >= COMPLETE_THRESHOLD) {
      // Snap to end + trigger
      animate(x, maxX, { duration: 0.1 })
      setComplete(true)

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 100])
      }

      setTimeout(() => {
        onComplete()
      }, 150)
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <div
      ref={constraintsRef}
      onLayout={(e: any) => setTrackWidth(e.nativeEvent?.layout?.width ?? 320)}
      className={cn(
        'relative w-full h-[64px] rounded-[16px] overflow-hidden select-none',
        disabled && 'opacity-40 cursor-not-allowed',
        complete ? 'bg-[' + bgColor + ']' : 'bg-[' + bgColorLight + ']'
      )}
      style={{
        background: complete ? bgColor : bgColorLight,
      }}
    >
      {/* Track label */}
      {!complete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[15px] font-bold tracking-wider" style={{ color: textColor }}>
            ← {label} →
          </span>
        </div>
      )}

      {/* Complete label */}
      {complete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[16px] font-bold text-white">✓ Starting...</span>
        </div>
      )}

      {/* Draggable thumb */}
      {!complete && (
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className="
            absolute top-[4px] left-[4px]
            w-[56px] h-[56px]
            rounded-[14px] cursor-grab active:cursor-grabbing
            flex items-center justify-center
            shadow-md
            z-10
          "
          style={{
            x,
            backgroundColor: bgColor,
          }}
        >
          <span className="text-white text-[20px] font-bold select-none">
            →
          </span>
        </motion.div>
      )}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — END TRIP FLOW (D3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
7A. EndTripFlow component
────────────────────────────────────────────

Create: apps/web/components/captain/
  EndTripFlow.tsx
'use client'

'use client'

import { useState, useEffect } from 'react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { SlideToConfirm } from '@/components/ui/SlideToConfirm'
import { formatDuration } from '@/lib/utils/format'

interface EndTripFlowProps {
  boatName: string
  startedAt: string | null
  token: string
  tripSlug: string
  onEnded: () => void
  onCancel: () => void
}

export function EndTripFlow({
  boatName, startedAt, token, tripSlug, onEnded, onCancel,
}: EndTripFlowProps) {
  const [elapsed, setElapsed] = useState('')
  const [isEnding, setIsEnding] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Live elapsed time counter
  useEffect(() => {
    if (!startedAt) return
    function update() {
      const ms = Date.now() - new Date(startedAt!).getTime()
      const hours = Math.floor(ms / 3600000)
      const mins = Math.floor((ms % 3600000) / 60000)
      setElapsed(`${hours}hr ${mins}min`)
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [startedAt])

  async function confirmEnd() {
    setIsEnding(true)
    setError('')

    try {
      const res = await fetch(
        `/api/trips/${tripSlug}/end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshotToken: token }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to end trip')
        setShowConfirm(false)
        return
      }

      onEnded()
    } catch {
      setError('Connection error. Please try again.')
      setShowConfirm(false)
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col">
      {/* Header */}
      <div className="bg-[#E8593C] px-5 pt-6 pb-5 text-white">
        <button onClick={onCancel} className="text-white/70 mb-3 text-[14px]">
          ← Back
        </button>
        <h1 className="text-[24px] font-bold">End this charter?</h1>
        <p className="text-white/80 text-[14px] mt-1">{boatName}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5">

        {/* Duration */}
        {elapsed && (
          <div className="bg-white rounded-[16px] p-5 border border-[#D0E2F3]">
            <p className="text-[13px] text-[#6B7C93] mb-1">Time since departure</p>
            <p className="text-[28px] font-black text-[#0D1B2A]">{elapsed}</p>
          </div>
        )}

        {/* What happens */}
        <div className="bg-white rounded-[16px] p-5 border border-[#D0E2F3]">
          <p className="text-[14px] font-semibold text-[#0D1B2A] mb-3">
            On ending:
          </p>
          <div className="space-y-2">
            {[
              'Trip marked as completed',
              'Insurance policy deactivated',
              'Guests sent review request (2hr delay)',
              'Trip postcards unlocked for guests',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-[#1D9E75]">✓</span>
                <span className="text-[14px] text-[#6B7C93]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#FDEAEA] rounded-[12px]">
            <p className="text-[14px] text-[#D63B3B]">{error}</p>
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="px-5 pb-10 pt-4 bg-white border-t border-[#D0E2F3]">
        <SlideToConfirm
          label="SLIDE TO END TRIP"
          onComplete={() => setShowConfirm(true)}
          color="coral"
        />
      </div>

      {/* Confirm overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-[rgba(12,68,124,0.5)] flex items-end">
          <div className="w-full bg-white rounded-t-[24px] px-6 py-6 pb-10">
            <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-5" />
            <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
              End charter?
            </h2>
            <p className="text-[14px] text-[#6B7C93] mb-6">
              This cannot be undone. The trip will be marked as completed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isEnding}
                className="flex-1 h-[56px] rounded-[12px] border border-[#D0E2F3] text-[#6B7C93] font-semibold text-[15px] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                disabled={isEnding}
                className="flex-1 h-[56px] rounded-[12px] bg-[#E8593C] text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isEnding ? <AnchorLoader size="sm" color="white" /> : 'End trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/captain/
  buoyClient.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activateBuoyPolicy, endBuoyPolicy } from '@/lib/buoy/client'

vi.mock('server-only', () => ({}))

describe('activateBuoyPolicy', () => {
  beforeEach(() => {
    vi.stubEnv('BUOY_API_KEY', '')
    vi.stubEnv('BUOY_API_URL', '')
  })

  it('returns stub when no API key configured', async () => {
    const result = await activateBuoyPolicy({
      tripId: 'trip-123',
      operatorId: 'op-456',
      guestCount: 7,
      boatType: 'motor_yacht',
      boatName: "Conrad's Yacht",
      marinaLat: 25.77,
      marinaLng: -80.13,
      tripDate: '2024-10-21',
      durationHours: 4,
    })

    expect(result.policyId).toContain('STUB')
    expect(result.status).toBe('pending')
  })

  it('returns failed gracefully on API error', async () => {
    vi.stubEnv('BUOY_API_KEY', 'test-key')
    vi.stubEnv('BUOY_API_URL', 'https://api.example.com')

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await activateBuoyPolicy({
      tripId: 'trip-123',
      operatorId: 'op-456',
      guestCount: 7,
      boatType: 'motor_yacht',
      boatName: "Test Boat",
      marinaLat: null,
      marinaLng: null,
      tripDate: '2024-10-21',
      durationHours: 4,
    })

    expect(result.status).toBe('failed')
    expect(result.policyId).toContain('FAILED')
  })

  it('normalises vessel type correctly', async () => {
    vi.stubEnv('BUOY_API_KEY', 'test-key')
    vi.stubEnv('BUOY_API_URL', 'https://api.example.com')

    let capturedBody: any
    global.fetch = vi.fn().mockImplementation(async (_, opts) => {
      capturedBody = JSON.parse(opts.body)
      return { ok: true, json: async () => ({
        policy_id: 'POL-123',
        policy_number: 'P-001',
        activated_at: new Date().toISOString(),
        coverage_until: new Date().toISOString(),
      })}
    })

    await activateBuoyPolicy({
      tripId: 'trip-123', operatorId: 'op-456',
      guestCount: 4, boatType: 'fishing_charter',
      boatName: 'Test', marinaLat: 25.77, marinaLng: -80.13,
      tripDate: '2024-10-21', durationHours: 6,
    })

    expect(capturedBody.vessel_type).toBe('fishing_vessel')
  })
})

Create: apps/web/__tests__/unit/captain/
  startTrip.test.ts

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Re-test the start schema directly
const startSchema = z.object({
  snapshotToken: z.string().min(10),
  captainName: z.string().max(100).optional(),
  confirmedGuestCount: z.number().int().min(0),
  checklistConfirmed: z.boolean().refine(v => v === true),
})

describe('trip start validation', () => {
  it('accepts valid start request', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: 7,
      checklistConfirmed: true,
    }).success).toBe(true)
  })

  it('rejects checklistConfirmed: false', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: 7,
      checklistConfirmed: false,
    }).success).toBe(false)
  })

  it('rejects token under 10 chars', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'short',
      confirmedGuestCount: 7,
      checklistConfirmed: true,
    }).success).toBe(false)
  })

  it('rejects negative guest count', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: -1,
      checklistConfirmed: true,
    }).success).toBe(false)
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 14 tests must pass before Phase 3F.

TEST 1 — Unit tests:
  npm run test
  All tests in __tests__/unit/captain/ pass

TEST 2 — Snapshot page loads:
  From 3D: click "Share to captain"
  Copy snapshot URL
  Open in new incognito window
  Page loads without login
  Shows: boat name, date, time, guest list
  Passenger alerts section (if any)
  "Slide to Start Trip" button visible

TEST 3 — Snapshot auto-refresh:
  Open snapshot page
  In another tab: register a new guest on the trip
  Wait 60 seconds
  Snapshot page: new guest appears in list
  WITHOUT manual refresh

TEST 4 — Token expiry (simulation):
  Manually modify Redis TTL for snapshot token to 1
  Wait 1 second
  Visit snapshot URL
  EXPECTED: "Link expired" page — clean message
  NOT a 500 error or blank page

TEST 5 — Invalid token:
  Visit /snapshot/completely-fake-token
  EXPECTED: "Invalid link" page
  NOT a 500 error

TEST 6 — Checklist enforcement:
  Open start trip flow
  Slider is disabled (grey background)
  "Complete checklist to continue"
  Tick all 5 checklist items
  Slider becomes teal and active

TEST 7 — Slider cannot be tapped:
  With checklist complete, tap the slider area
  (without dragging)
  EXPECTED: Nothing happens
  Trip DOES NOT start

TEST 8 — Slider drag and release:
  Drag slider to 50% then release
  EXPECTED: Slider snaps back to start
  Trip DOES NOT start

TEST 9 — Full start trip flow:
  Complete checklist
  Drag slider to 100%
  Confirmation overlay appears
  Shows: boat name, date, guest count
  4 bullet points of what will happen
  Tap "Start now"
  AnchorLoader shows briefly
  Success: page shows "Active" status
  Green insurance badge appears
  VERIFY in Supabase:
    trips.status = 'active'
    trips.started_at = current timestamp
    trips.guest_count_at_start = correct count
    audit_log: 'trip_started' entry with USCG fields

TEST 10 — Double-start prevention:
  Trip is already active
  Tap "Start now" again
  EXPECTED: Returns success with alreadyStarted: true
  NO second audit log entry
  NO second Buoy API call
  Redis lock cleared correctly

TEST 11 — Buoy stub (no API key):
  Ensure BUOY_API_KEY is empty in .env.local
  Start a trip
  EXPECTED: Trip starts successfully
  buoy_policy_id = 'STUB-...' (not null)
  No error shown to captain
  Warning logged in server console

TEST 12 — Operator dashboard updates:
  Open operator dashboard in one tab
  Open snapshot page in another
  Start the trip from snapshot
  Operator dashboard: trip card updates to "Active"
  WITHOUT operator refreshing
  (Supabase Realtime)

TEST 13 — End trip flow:
  From active snapshot page, tap "End Trip →"
  End trip flow renders
  Duration timer shows elapsed time
  Slider present with coral color
  Drag to complete → confirmation overlay
  Tap "End trip"
  Page shows "✓ Trip completed"
  VERIFY in Supabase:
    trips.status = 'completed'
    trips.ended_at set
    audit_log: 'trip_ended' entry

TEST 14 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  No 'any' in new files
  robots meta: noindex on snapshot pages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 14 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + what)
  3. All 14 test results: ✅ / ❌
  4. Supabase confirmation after TEST 9:
     - trips.status value
     - trips.started_at value
     - audit_log entry exists with USCG fields
     - buoy_policy_id value (stub or real)
  5. Redis confirmation after TEST 10:
     - Lock key was created and released
  6. Buoy API behaviour:
     - Is stub or real API key used?
     - Policy ID format
  7. Any deviations from spec + why
  8. Total lines added
```
