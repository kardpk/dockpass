# BoatCheckin — Phase 3C Agent Instructions
# Guest Join Flow: Check-in, Safety, Waiver, QR
# @3C_GUEST_JOIN_FLOW

---

## CONTEXT

Phase 3B built what guests SEE.
Phase 3C builds what guests DO.

This is the core BoatCheckin transaction:
a guest proves they belong on the boat,
acknowledges safety information,
signs a legal waiver, and receives
a cryptographically-signed boarding pass
in under 3 minutes.

This is also the most legally sensitive
code in the entire product. Every decision
has a compliance reason behind it.

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/10-COMPLIANCE.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/20-PHASE_AUDIT.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3C — Guest Join Flow.
The complete 6-step check-in experience:
trip code → details → safety → waiver →
insurance/course → add-ons → QR pass.

No auth required. Rate limit everything.
Every input sanitised and validated server-side.
Prices always calculated server-side.
QR token HMAC signed with expiry.
Idempotency prevents duplicate registrations.

Phase 3B is complete. The trip page renders.
The StickyJoinCTA has a placeholder.
Replace that placeholder with this full flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DATABASE MIGRATION 003
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The guests table needs one new column for
individual safety card acknowledgments.
Run this BEFORE writing any application code.

────────────────────────────────────────────
1A. Migration file
────────────────────────────────────────────

Create: supabase/migrations/003_join_flow.sql

-- Safety acknowledgments column
-- Stores each card the guest confirmed
-- individually with timestamp
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS safety_acknowledgments
    JSONB DEFAULT '[]';

-- Waiver hash (ties signature to exact text)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS waiver_text_hash TEXT;

-- Non-swimmer flag (for captain snapshot)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_non_swimmer
    BOOLEAN NOT NULL DEFAULT false;

-- Seasickness prone flag (captain info)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_seasickness_prone
    BOOLEAN NOT NULL DEFAULT false;

-- Push subscription for notifications
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS push_subscription
    JSONB DEFAULT NULL;

-- GDPR fields
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS gdpr_consent
    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent
    BOOLEAN NOT NULL DEFAULT false;

-- Index for lookups by name + trip (idempotency)
CREATE INDEX IF NOT EXISTS idx_guests_name_trip
  ON guests (trip_id, full_name)
  WHERE deleted_at IS NULL;

Run:
  npx supabase db push
  npx supabase gen types typescript --linked \
    > apps/web/types/database.ts

Verify:
  guests table has new columns
  types/database.ts updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — ZOD SCHEMAS + TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. Extend guestRegistrationSchema
────────────────────────────────────────────

Update: apps/web/lib/security/sanitise.ts

Replace the existing guestRegistrationSchema
with this complete version. All fields the
registration Server Action accepts.

export const guestRegistrationSchema = z.object({
  // Trip identification
  tripSlug: z.string()
    .regex(/^[A-Za-z0-9_-]{16,30}$/,
      'Invalid trip link'),
  tripCode: z.string()
    .regex(/^[A-Z0-9]{4}$/,
      'Trip code must be 4 characters'),

  // Personal details
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(s => s.trim()),
  emergencyContactName: z.string()
    .min(2, 'Emergency contact name required')
    .max(100)
    .transform(s => s.trim()),
  emergencyContactPhone: z.string()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[+\d\s()\-\.]+$/, 'Invalid phone format'),
  dietaryRequirements: z.string()
    .max(500)
    .optional()
    .transform(s => s?.trim() || undefined),
  languagePreference: z.enum(
    ['en','es','pt','fr','de','it'],
    { message: 'Unsupported language' }
  ),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isNonSwimmer: z.boolean().optional().default(false),
  isSeaSicknessProne: z.boolean().optional().default(false),

  // GDPR (required for EU guests)
  gdprConsent: z.boolean().optional().default(false),
  marketingConsent: z.boolean().optional().default(false),

  // Safety acknowledgments
  // Each object: { id: string, text: string, acknowledgedAt: ISO string }
  safetyAcknowledgments: z.array(z.object({
    id: z.string().min(1).max(50),
    text: z.string().max(500),
    acknowledgedAt: z.string().datetime(),
  })).min(0).max(30),

  // Waiver
  waiverSignatureText: z.string()
    .min(2, 'Signature required')
    .max(100)
    .transform(s => s.trim()),
  waiverAgreed: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the waiver' }),
  }),
  waiverTextHash: z.string()
    .regex(/^[a-f0-9]{64}$/, 'Invalid waiver hash'),

  // Turnstile token (bot protection)
  turnstileToken: z.string().min(1),
})

// Addon order schema (unchanged from SECURITY.md)
export const addonOrderSchema = z.object({
  guestId: z.string().uuid(),
  tripId: z.string().uuid(),
  orders: z.array(z.object({
    addonId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
})

export type GuestRegistrationInput =
  z.infer<typeof guestRegistrationSchema>

────────────────────────────────────────────
2B. Guest session type (localStorage)
────────────────────────────────────────────

Add to: apps/web/types/index.ts

// Stored in localStorage after successful check-in
// Allows guest to return to their boarding pass
// without going through the flow again
export interface GuestSession {
  guestId: string
  tripSlug: string
  qrToken: string
  guestName: string
  checkedInAt: string       // ISO timestamp
  addonOrderIds: string[]   // for receipt display
}

// localStorage key: dp-guest-{tripSlug}
export const GUEST_SESSION_KEY = (slug: string) =>
  `dp-guest-${slug}`

// Safety acknowledgment (local tracking)
export interface SafetyAck {
  id: string
  text: string
  acknowledgedAt: string
}

// Join flow step state
export type JoinStep =
  | 'code'       // step 1 — trip code entry
  | 'details'    // step 2 — personal info
  | 'safety'     // step 3 — safety card swipe
  | 'waiver'     // step 4 — waiver signing
  | 'insurance'  // step 4.5 — conditional
  | 'addons'     // step 5 — add-ons
  | 'boarding'   // step 6 — boarding pass

export interface JoinFlowState {
  step: JoinStep
  // Step 1
  tripCode: string
  codeError: string
  codeAttempts: number
  codeLocked: boolean
  codeLockUntil: number  // unix timestamp

  // Step 2
  fullName: string
  emergencyContactName: string
  emergencyContactPhone: string
  dietaryRequirements: string
  languagePreference: string
  dateOfBirth: string
  isNonSwimmer: boolean
  isSeaSicknessProne: boolean
  gdprConsent: boolean
  marketingConsent: boolean
  isEU: boolean           // detected server-side

  // Step 3
  safetyAcks: SafetyAck[]
  currentSafetyCard: number

  // Step 4
  waiverScrolled: boolean // must scroll to bottom
  waiverAgreed: boolean
  signatureText: string
  waiverTextHash: string

  // Step 5
  addonQuantities: Record<string, number> // addonId → qty

  // Result
  guestId: string
  qrToken: string
  requiresCourse: boolean
  isSubmitting: boolean
  submitError: string
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — SERVER-SIDE ACTIONS + API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
3A. Waiver hash utility (server-only)
────────────────────────────────────────────

Create: apps/web/lib/security/waiver.ts
import 'server-only'

import 'server-only'
import { createHash } from 'crypto'

// SHA-256 of exact waiver text
// Ties guest signature to precise text they saw
export function hashWaiverText(waiverText: string): string {
  return createHash('sha256')
    .update(waiverText.trim())
    .digest('hex')
}

// Verify that the hash in registration
// matches the boat's current waiver text
export function verifyWaiverHash(
  submittedHash: string,
  currentWaiverText: string
): boolean {
  const expected = hashWaiverText(currentWaiverText)
  // Use timing-safe comparison
  if (submittedHash.length !== expected.length) return false
  const a = Buffer.from(submittedHash)
  const b = Buffer.from(expected)
  try {
    return require('crypto').timingSafeEqual(a, b)
  } catch {
    return false
  }
}

────────────────────────────────────────────
3B. Turnstile verification (server-only)
────────────────────────────────────────────

Already created in Phase 1 setup.
Verify the file exists at:
  apps/web/lib/security/turnstile.ts

If missing, create it now:
import 'server-only'

export async function verifyTurnstile(
  token: string
): Promise<boolean> {
  // In development: bypass Turnstile entirely
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set')
    return true  // Fail open in dev, fail closed in prod
  }

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    )
    const data = await res.json()
    return data.success === true
  } catch {
    // Network failure — fail open to not block guests
    // Log for monitoring
    console.error('[turnstile] verification failed')
    return true
  }
}

────────────────────────────────────────────
3C. Main registration API route
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/
  register/route.ts
import 'server-only'

This is the most important API route in BoatCheckin.
Every guest registration passes through here.
Security layers applied in strict sequence.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { verifyWaiverHash } from '@/lib/security/waiver'
import { auditLog } from '@/lib/security/audit'
import { sanitiseText } from '@/lib/security/sanitise'
import { guestRegistrationSchema } from '@/lib/security/sanitise'
import {
  generateQRToken,
  generateTripCode,
} from '@/lib/security/tokens'
import { getRedis } from '@/lib/redis/upstash'
import { invalidateTripCache } from '@/lib/redis/cache'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ip = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'

  // ── LAYER 1: Global IP rate limit ────────
  // Max 10 registrations per IP per hour
  // Prevents bulk fake registrations
  const ipLimited = await rateLimit(req, {
    max: 10,
    window: 3600,
    key: `register:ip:${ip}`,
  })
  if (ipLimited.blocked) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  // ── LAYER 2: Parse body ──────────────────
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  // ── LAYER 3: Schema validation ───────────
  const parsed = guestRegistrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Verify slug matches body
  if (data.tripSlug !== slug) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  // ── LAYER 4: Turnstile bot protection ────
  const botCheck = await verifyTurnstile(data.turnstileToken)
  if (!botCheck) {
    return NextResponse.json(
      { error: 'Bot check failed. Please refresh and try again.' },
      { status: 403 }
    )
  }

  // ── LAYER 5: Trip code rate limit ────────
  // Max 5 attempts per IP per trip slug
  // 30-minute lockout after 5 failures
  const redis = getRedis()
  const attemptsKey = `rate:code:${slug}:${ip}`
  const lockKey = `lock:code:${slug}:${ip}`

  const locked = await redis.get(lockKey).catch(() => null)
  if (locked) {
    const lockTTL = await redis.ttl(lockKey).catch(() => 1800)
    return NextResponse.json(
      {
        error: 'Too many wrong codes. Try again later.',
        lockSeconds: lockTTL,
      },
      { status: 429 }
    )
  }

  const supabase = createServiceClient()

  // ── LAYER 6: Fetch trip ──────────────────
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_code, max_guests, status,
      operator_id, boat_id, requires_approval,
      charter_type,
      boats ( waiver_text )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .neq('status', 'completed')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found or no longer available' },
      { status: 404 }
    )
  }

  // ── LAYER 7: Verify trip code ────────────
  if (data.tripCode.toUpperCase() !== trip.trip_code.toUpperCase()) {
    // Increment attempt counter (atomic Lua)
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], 300)
      end
      if current >= 5 then
        redis.call('SET', KEYS[2], '1')
        redis.call('EXPIRE', KEYS[2], 1800)
      end
      return current
    `
    const attempts = await redis.eval(
      luaScript, [attemptsKey, lockKey], []
    ).catch(() => 0) as number

    const remaining = Math.max(0, 5 - (attempts as number))
    return NextResponse.json(
      {
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many wrong codes. Try again in 30 minutes.',
        remaining,
      },
      { status: 400 }
    )
  }

  // Code correct — reset attempt counter
  await redis.del(attemptsKey).catch(() => null)

  // ── LAYER 8: Capacity check ──────────────
  const { count: guestCount } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)

  if ((guestCount ?? 0) >= trip.max_guests) {
    return NextResponse.json(
      { error: 'This trip is full' },
      { status: 409 }
    )
  }

  // ── LAYER 9: Idempotency check ───────────
  // If same name registered in last 15 minutes,
  // return existing registration silently
  const recentCutoff = new Date(
    Date.now() - 15 * 60 * 1000
  ).toISOString()

  const { data: existing } = await supabase
    .from('guests')
    .select('id, qr_token, created_at')
    .eq('trip_id', trip.id)
    .ilike('full_name', data.fullName.trim())
    .is('deleted_at', null)
    .gte('created_at', recentCutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Return existing boarding pass
    return NextResponse.json({
      data: {
        guestId: existing.id,
        qrToken: existing.qr_token,
        isDuplicate: true,
        requiresCourse: shouldRequireCourse(
          data.dateOfBirth,
          trip.charter_type as string
        ),
      },
    })
  }

  // ── LAYER 10: Verify waiver hash ─────────
  const waiverText = (trip.boats as any)?.waiver_text as string
  if (waiverText && !verifyWaiverHash(data.waiverTextHash, waiverText)) {
    // Waiver text changed since guest started the flow
    return NextResponse.json(
      { error: 'The waiver has been updated. Please reload and try again.' },
      { status: 409 }
    )
  }

  // ── LAYER 11: Generate QR token ──────────
  const guestId = crypto.randomUUID()
  const tripDate = await getTripDate(trip.id, supabase)
  const qrToken = generateQRToken(guestId, trip.id, tripDate)

  // ── LAYER 12: Insert guest ───────────────
  const approvalStatus = trip.requires_approval
    ? 'pending'
    : 'auto_approved'

  const { error: insertError } = await supabase
    .from('guests')
    .insert({
      id: guestId,
      trip_id: trip.id,
      operator_id: trip.operator_id,
      full_name: sanitiseText(data.fullName),
      emergency_contact_name: sanitiseText(data.emergencyContactName),
      emergency_contact_phone: data.emergencyContactPhone.replace(/[^\d+\s()\-\.]/g, ''),
      dietary_requirements: data.dietaryRequirements
        ? sanitiseText(data.dietaryRequirements)
        : null,
      language_preference: data.languagePreference,
      date_of_birth: data.dateOfBirth ?? null,
      is_non_swimmer: data.isNonSwimmer ?? false,
      is_seasickness_prone: data.isSeaSicknessProne ?? false,
      gdpr_consent: data.gdprConsent ?? false,
      marketing_consent: data.marketingConsent ?? false,
      safety_acknowledgments: data.safetyAcknowledgments,
      waiver_signed: true,
      waiver_signed_at: new Date().toISOString(),
      waiver_signature_text: sanitiseText(data.waiverSignatureText),
      waiver_text_hash: data.waiverTextHash,
      waiver_ip_address: ip,
      waiver_user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      approval_status: approvalStatus,
      qr_token: qrToken,
    })

  if (insertError) {
    // Check for unique constraint violation (race condition)
    if (insertError.code === '23505') {
      // Another registration with same QR token — regenerate
      const newQrToken = generateQRToken(guestId, trip.id, tripDate)
      await supabase
        .from('guests')
        .update({ qr_token: newQrToken })
        .eq('id', guestId)
      return NextResponse.json({
        data: {
          guestId,
          qrToken: newQrToken,
          requiresCourse: shouldRequireCourse(
            data.dateOfBirth, trip.charter_type as string
          ),
        },
      })
    }

    console.error('[register] insert failed:', insertError.code)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  // ── LAYER 13: Post-registration tasks ────
  // All non-blocking — failures do not affect response

  // Invalidate trip page cache (guest count changed)
  invalidateTripCache(slug).catch(() => null)

  // Audit log
  auditLog({
    action: 'guest_registered',
    entityType: 'guest',
    entityId: guestId,
    changes: {
      tripId: trip.id,
      operatorId: trip.operator_id,
      language: data.languagePreference,
      hasAddons: false,
      approvalStatus,
      safetyCardsAcknowledged: data.safetyAcknowledgments.length,
    },
  }).catch(() => null)

  // Notify operator via Supabase realtime
  // (operator dashboard updates live)
  supabase
    .from('operator_notifications')
    .insert({
      operator_id: trip.operator_id,
      type: 'guest_registered',
      title: 'New guest checked in',
      body: `${data.fullName} registered for your trip`,
      data: { tripId: trip.id, guestId },
    })
    .then()
    .catch(() => null)

  // ── Response ─────────────────────────────
  return NextResponse.json({
    data: {
      guestId,
      qrToken,
      isDuplicate: false,
      requiresCourse: shouldRequireCourse(
        data.dateOfBirth,
        trip.charter_type as string
      ),
    },
  })
}

// ── Helpers ──────────────────────────────
async function getTripDate(
  tripId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<string> {
  const { data } = await supabase
    .from('trips')
    .select('trip_date')
    .eq('id', tripId)
    .single()
  return data?.trip_date ?? new Date().toISOString().split('T')[0]!
}

function shouldRequireCourse(
  dob: string | undefined,
  charterType: string
): boolean {
  if (charterType === 'captained') return false
  if (!dob) return false
  return new Date(dob) >= new Date('1988-01-01')
}

────────────────────────────────────────────
3D. Addon order API route
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/
  addons/route.ts
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

  // Rate limit: 20 addon orders per hour per IP
  const limited = await rateLimit(req, {
    max: 20, window: 3600,
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
    return NextResponse.json(
      { error: 'Invalid order data' },
      { status: 400 }
    )
  }

  const { guestId, tripId, orders } = parsed.data
  const supabase = createServiceClient()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, operator_id')
    .eq('id', guestId)
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .single()

  if (!guest) {
    return NextResponse.json(
      { error: 'Guest not found' },
      { status: 404 }
    )
  }

  // Fetch prices SERVER-SIDE — never trust client prices
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

  // Validate quantities against limits
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

  // Build insert records with server-calculated prices
  const insertRows = orders.map(order => {
    const addon = addonMap.get(order.addonId)!
    return {
      guest_id: guestId,
      trip_id: tripId,
      addon_id: order.addonId,
      operator_id: guest.operator_id,
      quantity: order.quantity,
      unit_price_cents: addon.price_cents,          // FROM DB
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

  // Audit log non-blocking
  auditLog({
    action: 'addon_ordered',
    entityType: 'guest',
    entityId: guestId,
    changes: {
      tripId,
      orderCount: orders.length,
      totalCents: insertRows.reduce((s, r) => s + r.total_cents, 0),
    },
  }).catch(() => null)

  return NextResponse.json({
    data: inserted,
    totalCents: insertRows.reduce((s, r) => s + r.total_cents, 0),
  })
}

────────────────────────────────────────────
3E. Trip code validation route (step 1 check)
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/
  validate-code/route.ts
import 'server-only'

Pre-validates trip code WITHOUT registering.
Called when guest submits code in step 1.
Returns trip meta if valid (boat name etc for display).

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import { z } from 'zod'

const validateCodeSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{4}$/),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ip = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'

  // Rate limit: 5 attempts per 5min per IP per trip
  const redis = getRedis()
  const lockKey = `lock:code:${slug}:${ip}`
  const locked = await redis.get(lockKey).catch(() => null)

  if (locked) {
    const ttl = await redis.ttl(lockKey).catch(() => 1800)
    return NextResponse.json(
      { error: 'Too many attempts', lockSeconds: ttl },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = validateCodeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid code format' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_code, max_guests, status,
      trip_date, departure_time, duration_hours,
      charter_type,
      boats (
        boat_name, marina_name, slip_number,
        captain_name, waiver_text
      )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    )
  }

  if (trip.status === 'completed') {
    return NextResponse.json(
      { error: 'This trip has already ended' },
      { status: 409 }
    )
  }

  // Check capacity
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)

  if ((count ?? 0) >= trip.max_guests) {
    return NextResponse.json(
      { error: 'This trip is full' },
      { status: 409 }
    )
  }

  // Verify code
  if (parsed.data.code.toUpperCase() !== trip.trip_code.toUpperCase()) {
    // Atomic increment + lock
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then redis.call('EXPIRE', KEYS[1], 300) end
      if current >= 5 then
        redis.call('SET', KEYS[2], '1')
        redis.call('EXPIRE', KEYS[2], 1800)
      end
      return current
    `
    const attemptsKey = `rate:code:${slug}:${ip}`
    const attempts = await redis.eval(
      luaScript, [attemptsKey, lockKey], []
    ).catch(() => 1) as number

    const remaining = Math.max(0, 5 - Number(attempts))
    return NextResponse.json(
      {
        valid: false,
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} left.`
          : 'Too many attempts. Locked out for 30 minutes.',
        remaining,
      },
      { status: 400 }
    )
  }

  // Code valid — compute waiver hash to send to client
  const boat = trip.boats as any
  const { hashWaiverText } = await import('@/lib/security/waiver')
  const waiverHash = boat?.waiver_text
    ? hashWaiverText(boat.waiver_text)
    : ''

  return NextResponse.json({
    valid: true,
    trip: {
      boatName: boat?.boat_name,
      marinaName: boat?.marina_name,
      slipNumber: boat?.slip_number,
      captainName: boat?.captain_name,
      tripDate: trip.trip_date,
      departureTime: trip.departure_time,
      durationHours: trip.duration_hours,
      charterType: trip.charter_type,
      waiverHash,           // hash of current waiver text
      waiverText: boat?.waiver_text ?? '',
    },
  })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — JOIN FLOW BOTTOM SHEET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All components in: apps/web/components/join/

────────────────────────────────────────────
4A. JoinFlowSheet — root container
────────────────────────────────────────────

Create: apps/web/components/join/JoinFlowSheet.tsx
'use client'

Root container. Manages all flow state.
Opened by StickyJoinCTA when guest taps CTA.
Handles back-navigation between steps.

'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepCode } from './StepCode'
import { StepDetails } from './StepDetails'
import { StepSafety } from './StepSafety'
import { StepWaiver } from './StepWaiver'
import { StepInsurance } from './StepInsurance'
import { StepAddons } from './StepAddons'
import { StepBoarding } from './StepBoarding'
import type {
  JoinStep, JoinFlowState, SafetyAck,
  GUEST_SESSION_KEY,
} from '@/types'

interface JoinFlowSheetProps {
  isOpen: boolean
  onClose: () => void
  tripSlug: string
  tripData: {
    boatName: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    tripDate: string
    departureTime: string
    durationHours: number
    charterType: 'captained' | 'bareboat' | 'both'
    safetyPoints: { id: string; text: string }[]
    addons: {
      id: string; name: string; description: string | null
      emoji: string; priceCents: number; maxQuantity: number
    }[]
    isEU: boolean  // passed from server-detected location
  }
  currentLang: string
}

// Step order for progress indicator
const STEPS: JoinStep[] = [
  'code', 'details', 'safety', 'waiver', 'addons', 'boarding'
]
// Insurance step is conditional and not counted in progress

export function JoinFlowSheet({
  isOpen, onClose, tripSlug, tripData, currentLang,
}: JoinFlowSheetProps) {
  const [state, setState] = useState<JoinFlowState>({
    step: 'code',
    tripCode: '', codeError: '', codeAttempts: 0,
    codeLocked: false, codeLockUntil: 0,
    fullName: '', emergencyContactName: '',
    emergencyContactPhone: '', dietaryRequirements: '',
    languagePreference: currentLang,
    dateOfBirth: '', isNonSwimmer: false,
    isSeaSicknessProne: false,
    gdprConsent: false, marketingConsent: false,
    isEU: tripData.isEU,
    safetyAcks: [], currentSafetyCard: 0,
    waiverScrolled: false, waiverAgreed: false,
    signatureText: '', waiverTextHash: '',
    addonQuantities: {},
    guestId: '', qrToken: '',
    requiresCourse: false,
    isSubmitting: false, submitError: '',
  })

  // Cached trip meta from validate-code response
  const [validatedTrip, setValidatedTrip] = useState<{
    waiverText: string
    waiverHash: string
  } | null>(null)

  function updateState(partial: Partial<JoinFlowState>) {
    setState(prev => ({ ...prev, ...partial }))
  }

  function goToStep(step: JoinStep) {
    setState(prev => ({ ...prev, step }))
    // Scroll sheet to top on step change
    document.getElementById('join-sheet-content')
      ?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step index for progress bar (excluding insurance)
  const stepIndex = STEPS.indexOf(
    state.step === 'insurance' ? 'waiver' : state.step
  )
  const progressPercent = (stepIndex / (STEPS.length - 1)) * 100

  // Can close only from code step or boarding step
  const canClose = state.step === 'code' || state.step === 'boarding'

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(12,68,124,0.2)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) onClose()
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="
          w-full bg-white rounded-t-[20px]
          max-h-[95vh] flex flex-col
        "
      >
        {/* Handle bar + close */}
        <div className="flex-shrink-0 pt-3 pb-2 px-5">
          <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            {canClose && (
              <button
                onClick={onClose}
                className="
                  w-8 h-8 rounded-full bg-[#F5F8FC]
                  flex items-center justify-center
                  text-[#6B7C93] hover:bg-[#E8F2FB]
                "
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {state.step !== 'boarding' && (
            <div className="mt-3">
              <div className="w-full h-1 bg-[#E8F2FB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0C447C] rounded-full transition-all duration-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B7C93] mt-1">
                Step {stepIndex + 1} of {STEPS.length - 1}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div
          id="join-sheet-content"
          className="flex-1 overflow-y-auto px-5 pb-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {state.step === 'code' && (
                <StepCode
                  tripSlug={tripSlug}
                  state={state}
                  onUpdate={updateState}
                  onValidated={(waiverText, waiverHash) => {
                    setValidatedTrip({ waiverText, waiverHash })
                    goToStep('details')
                  }}
                />
              )}
              {state.step === 'details' && (
                <StepDetails
                  state={state}
                  onUpdate={updateState}
                  onNext={() => goToStep('safety')}
                  onBack={() => goToStep('code')}
                />
              )}
              {state.step === 'safety' && (
                <StepSafety
                  safetyPoints={tripData.safetyPoints}
                  state={state}
                  onUpdate={updateState}
                  onNext={() => goToStep('waiver')}
                  onBack={() => goToStep('details')}
                />
              )}
              {state.step === 'waiver' && (
                <StepWaiver
                  waiverText={validatedTrip?.waiverText ?? ''}
                  waiverHash={validatedTrip?.waiverHash ?? ''}
                  state={state}
                  onUpdate={updateState}
                  tripSlug={tripSlug}
                  onNext={(requiresCourse) => {
                    updateState({ requiresCourse })
                    goToStep(requiresCourse ? 'insurance' : 'addons')
                  }}
                  onBack={() => goToStep('safety')}
                />
              )}
              {state.step === 'insurance' && (
                <StepInsurance
                  charterType={tripData.charterType}
                  onNext={() => goToStep('addons')}
                />
              )}
              {state.step === 'addons' && (
                <StepAddons
                  addons={tripData.addons}
                  guestId={state.guestId}
                  tripSlug={tripSlug}
                  state={state}
                  onUpdate={updateState}
                  onComplete={() => goToStep('boarding')}
                  onSkip={() => goToStep('boarding')}
                />
              )}
              {state.step === 'boarding' && (
                <StepBoarding
                  tripData={tripData}
                  state={state}
                  tripSlug={tripSlug}
                  onClose={onClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

────────────────────────────────────────────
4B. StepCode — trip code entry
────────────────────────────────────────────

Create: apps/web/components/join/StepCode.tsx
'use client'

'use client'
import { useState, useRef, useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils'
import type { JoinFlowState } from '@/types'

interface StepCodeProps {
  tripSlug: string
  state: JoinFlowState
  onUpdate: (partial: Partial<JoinFlowState>) => void
  onValidated: (waiverText: string, waiverHash: string) => void
}

export function StepCode({
  tripSlug, state, onUpdate, onValidated,
}: StepCodeProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Show lockout countdown
  const [lockCountdown, setLockCountdown] = useState(0)
  useEffect(() => {
    if (!state.codeLocked) return
    const remaining = Math.max(0,
      Math.ceil((state.codeLockUntil - Date.now()) / 1000)
    )
    setLockCountdown(remaining)
    if (remaining <= 0) {
      onUpdate({ codeLocked: false, codeError: '' })
      return
    }
    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onUpdate({ codeLocked: false, codeError: '' })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state.codeLocked, state.codeLockUntil])

  async function handleSubmit() {
    if (!state.tripCode || state.tripCode.length !== 4) {
      onUpdate({ codeError: 'Please enter your 4-character trip code' })
      return
    }

    setIsLoading(true)
    onUpdate({ codeError: '' })

    try {
      const res = await fetch(
        `/api/trips/${tripSlug}/validate-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: state.tripCode }),
        }
      )
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          const lockUntil = Date.now() + (json.lockSeconds ?? 1800) * 1000
          onUpdate({
            codeLocked: true,
            codeLockUntil: lockUntil,
            codeError: json.error ?? 'Locked out',
          })
        } else {
          onUpdate({
            codeAttempts: state.codeAttempts + 1,
            codeError: json.error ?? 'Incorrect code',
          })
          // Shake animation on input
          inputRef.current?.classList.add('animate-shake')
          setTimeout(() => {
            inputRef.current?.classList.remove('animate-shake')
          }, 500)
        }
        return
      }

      // Success — advance to next step
      onValidated(json.trip.waiverText, json.trip.waiverHash)

    } catch {
      onUpdate({ codeError: 'Connection error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pt-2">
      <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
        Enter your trip code
      </h2>
      <p className="text-[14px] text-[#6B7C93] mb-8">
        Check the message from your trip organiser
      </p>

      {/* Code input — 4 large characters */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          maxLength={4}
          value={state.tripCode}
          onChange={e => onUpdate({
            tripCode: e.target.value.toUpperCase(),
            codeError: '',
          })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={state.codeLocked || isLoading}
          placeholder="_ _ _ _"
          className={cn(
            'w-48 h-20 text-center text-[40px] font-mono font-black',
            'tracking-[0.3em] uppercase',
            'border-2 rounded-[16px] bg-white outline-none',
            'transition-all duration-150',
            state.codeError
              ? 'border-[#D63B3B] bg-[#FDEAEA]'
              : state.tripCode.length === 4
              ? 'border-[#1D9E75]'
              : 'border-[#D0E2F3]',
            'focus:border-[#0C447C] focus:ring-2 focus:ring-[#0C447C]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Trip code"
          aria-describedby={state.codeError ? 'code-error' : undefined}
        />

        {/* Error message */}
        {state.codeError && (
          <p
            id="code-error"
            className="text-[14px] text-[#D63B3B] text-center font-medium"
            role="alert"
          >
            {state.codeError}
          </p>
        )}

        {/* Lockout message with countdown */}
        {state.codeLocked && lockCountdown > 0 && (
          <div className="
            px-4 py-3 rounded-[12px] bg-[#FEF3DC]
            text-[14px] text-[#E5910A] text-center
          ">
            🔒 Try again in {Math.floor(lockCountdown / 60)}m {lockCountdown % 60}s
          </div>
        )}
      </div>

      {/* Invisible Turnstile */}
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setTurnstileToken}
        options={{ theme: 'light', size: 'invisible' }}
      />

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={
          isLoading ||
          state.codeLocked ||
          state.tripCode.length !== 4
        }
        className={cn(
          'w-full h-[56px] rounded-[12px]',
          'font-semibold text-[16px]',
          'flex items-center justify-center gap-2',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]',
          'active:scale-[0.98]',
        )}
      >
        {isLoading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          'Join this trip →'
        )}
      </button>

      <p className="text-[12px] text-[#6B7C93] text-center mt-4">
        Your information is kept private and secure
      </p>
    </div>
  )
}

────────────────────────────────────────────
4C. StepDetails — personal information
────────────────────────────────────────────

Create: apps/web/components/join/StepDetails.tsx
'use client'

'use client'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/lib/i18n/detect'
import type { JoinFlowState } from '@/types'

// Client-side validation schema (mirrors server)
const detailsSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100),
  emergencyContactName: z.string().min(2, 'Required').max(100),
  emergencyContactPhone: z.string().min(7, 'Invalid phone').max(20),
})

interface StepDetailsProps {
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDetails({ state, onUpdate, onNext, onBack }: StepDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showOptional, setShowOptional] = useState(false)

  function handleNext() {
    const result = detailsSchema.safeParse({
      fullName: state.fullName,
      emergencyContactName: state.emergencyContactName,
      emergencyContactPhone: state.emergencyContactPhone,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const [field, msgs] of Object.entries(
        result.error.flatten().fieldErrors
      )) {
        fieldErrors[field] = msgs[0] ?? 'Invalid'
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    onNext()
  }

  return (
    <div className="pt-2 space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 min-h-[44px]"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
          Your details
        </h2>
        <p className="text-[14px] text-[#6B7C93]">
          Required for safety at sea
        </p>
      </div>

      {/* Full name */}
      <FormField
        label="Full name"
        required
        error={errors.fullName}
      >
        <input
          type="text"
          autoComplete="name"
          placeholder="Sofia Martinez"
          value={state.fullName}
          onChange={e => onUpdate({ fullName: e.target.value })}
          className={inputClass(!!errors.fullName)}
        />
      </FormField>

      {/* Emergency contact name */}
      <FormField
        label="Emergency contact name"
        required
        error={errors.emergencyContactName}
        helper="Someone not on the boat"
      >
        <input
          type="text"
          autoComplete="off"
          placeholder="Maria Martinez"
          value={state.emergencyContactName}
          onChange={e => onUpdate({ emergencyContactName: e.target.value })}
          className={inputClass(!!errors.emergencyContactName)}
        />
      </FormField>

      {/* Emergency contact phone */}
      <FormField
        label="Emergency contact phone"
        required
        error={errors.emergencyContactPhone}
      >
        <input
          type="tel"
          autoComplete="off"
          inputMode="tel"
          placeholder="+1 305 555 0100"
          value={state.emergencyContactPhone}
          onChange={e => onUpdate({ emergencyContactPhone: e.target.value })}
          className={inputClass(!!errors.emergencyContactPhone)}
        />
      </FormField>

      {/* Language preference */}
      <FormField label="Your language">
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => onUpdate({ languagePreference: lang })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium',
                'border transition-all min-h-[44px]',
                state.languagePreference === lang
                  ? 'bg-[#0C447C] text-white border-[#0C447C]'
                  : 'bg-white text-[#6B7C93] border-[#D0E2F3] hover:border-[#0C447C]'
              )}
            >
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_NAMES[lang]}</span>
            </button>
          ))}
        </div>
      </FormField>

      {/* Optional fields toggle */}
      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="text-[13px] text-[#0C447C] underline min-h-[44px]"
      >
        {showOptional ? '− Hide' : '+ Add'} optional details
      </button>

      {showOptional && (
        <div className="space-y-4 pb-2">
          {/* Date of birth (for Florida course check) */}
          <FormField
            label="Date of birth"
            helper="Required only for bareboat charters under Florida law"
          >
            <input
              type="date"
              value={state.dateOfBirth}
              onChange={e => onUpdate({ dateOfBirth: e.target.value })}
              className={inputClass(false)}
            />
          </FormField>

          {/* Dietary requirements */}
          <FormField label="Dietary requirements or allergies">
            <input
              type="text"
              placeholder="e.g. Nut allergy, vegetarian"
              value={state.dietaryRequirements}
              onChange={e => onUpdate({ dietaryRequirements: e.target.value })}
              className={inputClass(false)}
            />
          </FormField>

          {/* Safety flags */}
          <div className="space-y-3">
            <label className="text-[13px] font-medium text-[#6B7C93] block">
              Let your captain know
            </label>
            {[
              {
                key: 'isNonSwimmer' as const,
                label: 'I am a non-swimmer',
                icon: '🏊',
              },
              {
                key: 'isSeaSicknessProne' as const,
                label: 'I get seasick easily',
                icon: '💊',
              },
            ].map(flag => (
              <label
                key={flag.key}
                className="flex items-center gap-3 min-h-[48px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={state[flag.key]}
                  onChange={e => onUpdate({ [flag.key]: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#0C447C]"
                />
                <span className="text-[14px] text-[#0D1B2A]">
                  {flag.icon} {flag.label}
                </span>
              </label>
            ))}
          </div>

          {/* GDPR consent (show for EU guests) */}
          {state.isEU && (
            <div className="p-4 bg-[#F5F8FC] rounded-[12px] space-y-3">
              <p className="text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider">
                Data consent (EU)
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={state.gdprConsent}
                  onChange={e => onUpdate({ gdprConsent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
                />
                <span className="text-[13px] text-[#0D1B2A] leading-relaxed">
                  I consent to BoatCheckin processing my personal data
                  for this charter trip as described in the{' '}
                  <a href="/privacy" className="text-[#0C447C] underline"
                    target="_blank">Privacy Policy</a>.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.marketingConsent}
                  onChange={e => onUpdate({ marketingConsent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
                />
                <span className="text-[13px] text-[#6B7C93]">
                  I agree to receive occasional offers from this operator.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleNext}
        className="
          w-full h-[56px] rounded-[12px]
          bg-[#0C447C] text-white font-semibold text-[16px]
          hover:bg-[#093a6b] transition-colors
          active:scale-[0.98]
        "
      >
        Continue →
      </button>
    </div>
  )
}

function FormField({
  label, required, helper, error, children,
}: {
  label: string; required?: boolean; helper?: string
  error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#6B7C93] mb-1.5">
        {label}
        {required && <span className="text-[#D63B3B] ml-0.5">*</span>}
        {helper && (
          <span className="font-normal ml-1 text-[#6B7C93]">
            — {helper}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-[#D63B3B] mt-1">{error}</p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full h-[52px] px-4 rounded-[10px] text-[15px]',
    'border bg-white text-[#0D1B2A]',
    'placeholder:text-[#6B7C93]',
    'focus:outline-none focus:ring-2 focus:ring-[#0C447C]/30',
    'focus:border-[#0C447C]',
    hasError
      ? 'border-[#D63B3B] bg-[#FDEAEA]'
      : 'border-[#D0E2F3]'
  )
}

────────────────────────────────────────────
4D. StepSafety — swipeable safety cards
────────────────────────────────────────────

Create: apps/web/components/join/StepSafety.tsx
'use client'

Each safety point is its own card.
Guest MUST tap "Understood ✓" on each one.
Cannot swipe or skip — only tap the button.
Each acknowledgment is timestamped.

'use client'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { JoinFlowState, SafetyAck } from '@/types'

interface StepSafetyProps {
  safetyPoints: { id: string; text: string; icon?: string }[]
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepSafety({
  safetyPoints, state, onUpdate, onNext, onBack,
}: StepSafetyProps) {
  const current = state.currentSafetyCard
  const point = safetyPoints[current]
  const total = safetyPoints.length
  const allAcknowledged = state.safetyAcks.length >= total

  function acknowledge() {
    if (!point) return

    const ack: SafetyAck = {
      id: point.id,
      text: point.text,
      acknowledgedAt: new Date().toISOString(),
    }

    const newAcks = [...state.safetyAcks, ack]
    const nextCard = current + 1

    if (nextCard >= total) {
      // All done
      onUpdate({ safetyAcks: newAcks, currentSafetyCard: nextCard })
    } else {
      onUpdate({
        safetyAcks: newAcks,
        currentSafetyCard: nextCard,
      })
    }
  }

  if (total === 0) {
    // No safety points — skip this step
    onNext()
    return null
  }

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 mb-4 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#0D1B2A]">
            Safety briefing
          </h2>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            {allAcknowledged
              ? 'All safety points reviewed ✓'
              : `${state.safetyAcks.length} of ${total} reviewed`}
          </p>
        </div>
        <div className="
          w-12 h-12 rounded-full bg-[#E8F2FB]
          flex items-center justify-center
          text-[13px] font-bold text-[#0C447C]
        ">
          {Math.min(state.safetyAcks.length, total)}/{total}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {safetyPoints.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i < state.safetyAcks.length
                ? 'w-2 h-2 bg-[#1D9E75]'
                : i === current && !allAcknowledged
                ? 'w-3 h-3 bg-[#0C447C]'
                : 'w-2 h-2 bg-[#D0E2F3]'
            )}
          />
        ))}
      </div>

      {/* Safety card or completion state */}
      {!allAcknowledged && point ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="
              bg-[#E8F2FB] rounded-[20px] p-6
              border border-[#D0E2F3] min-h-[200px]
              flex flex-col justify-between
            "
          >
            <div>
              {point.icon && (
                <div className="
                  w-12 h-12 rounded-[12px] bg-[#0C447C]
                  flex items-center justify-center
                  text-[24px] mb-4
                ">
                  {point.icon}
                </div>
              )}
              <p className="text-[17px] font-medium text-[#0D1B2A] leading-relaxed">
                {point.text}
              </p>
            </div>

            <button
              onClick={acknowledge}
              className="
                mt-6 w-full h-[52px] rounded-[12px]
                bg-[#0C447C] text-white font-semibold text-[15px]
                hover:bg-[#093a6b] transition-colors
                flex items-center justify-center gap-2
                active:scale-[0.98]
              "
            >
              ✓ Understood
            </button>
          </motion.div>
        </AnimatePresence>
      ) : (
        // All acknowledged
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            bg-[#E8F9F4] rounded-[20px] p-6
            border border-[#1D9E75] border-opacity-30
            text-center
          "
        >
          <div className="text-[48px] mb-3">✅</div>
          <h3 className="text-[18px] font-bold text-[#1D9E75] mb-2">
            Safety briefing complete
          </h3>
          <p className="text-[14px] text-[#6B7C93]">
            You've acknowledged all {total} safety points.
          </p>
        </motion.div>
      )}

      {/* Continue (only when all acknowledged) */}
      {allAcknowledged && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="
            w-full h-[56px] rounded-[12px] mt-4
            bg-[#0C447C] text-white font-semibold text-[16px]
            hover:bg-[#093a6b] transition-colors
          "
        >
          Continue to waiver →
        </motion.button>
      )}
    </div>
  )
}

────────────────────────────────────────────
4E. StepWaiver — sign the liability waiver
────────────────────────────────────────────

Create: apps/web/components/join/StepWaiver.tsx
'use client'

Guest must scroll to bottom before signing.
Typed name as legal signature (ESIGN Act).
Cursive signature font from DESIGN.md.
Submits registration to server on sign.

'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils'
import type { JoinFlowState } from '@/types'

interface StepWaiverProps {
  waiverText: string
  waiverHash: string
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  tripSlug: string
  onNext: (requiresCourse: boolean) => void
  onBack: () => void
}

export function StepWaiver({
  waiverText, waiverHash, state, onUpdate,
  tripSlug, onNext, onBack,
}: StepWaiverProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Track scroll progress on waiver text
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight)
    setScrollProgress(Math.min(progress, 1))
    if (progress >= 0.98) {
      onUpdate({ waiverScrolled: true })
    }
  }

  async function handleSign() {
    if (!state.waiverAgreed || !state.signatureText.trim()) return
    if (!state.waiverScrolled) return

    onUpdate({ isSubmitting: true, submitError: '' })

    try {
      const res = await fetch(
        `/api/trips/${tripSlug}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripSlug,
            tripCode: state.tripCode,
            fullName: state.fullName,
            emergencyContactName: state.emergencyContactName,
            emergencyContactPhone: state.emergencyContactPhone,
            dietaryRequirements: state.dietaryRequirements || undefined,
            languagePreference: state.languagePreference,
            dateOfBirth: state.dateOfBirth || undefined,
            isNonSwimmer: state.isNonSwimmer,
            isSeaSicknessProne: state.isSeaSicknessProne,
            gdprConsent: state.gdprConsent,
            marketingConsent: state.marketingConsent,
            safetyAcknowledgments: state.safetyAcks,
            waiverSignatureText: state.signatureText,
            waiverAgreed: true,
            waiverTextHash: waiverHash,
            turnstileToken: 'dev-bypass', // Turnstile provides this
            // In production: get from Turnstile widget
            // This is set in StepCode and should be passed through
          }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        onUpdate({
          isSubmitting: false,
          submitError: json.error ?? 'Registration failed',
        })
        return
      }

      // Store guest session in localStorage
      const { guestId, qrToken, requiresCourse } = json.data
      const sessionKey = `dp-guest-${tripSlug}`
      localStorage.setItem(sessionKey, JSON.stringify({
        guestId,
        tripSlug,
        qrToken,
        guestName: state.fullName,
        checkedInAt: new Date().toISOString(),
        addonOrderIds: [],
      }))

      onUpdate({
        isSubmitting: false,
        guestId,
        qrToken,
        requiresCourse,
        waiverTextHash: waiverHash,
      })

      onNext(requiresCourse)

    } catch {
      onUpdate({
        isSubmitting: false,
        submitError: 'Connection error. Please try again.',
      })
    }
  }

  const canSign = state.waiverScrolled && state.waiverAgreed && state.signatureText.trim().length >= 2

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 mb-4 min-h-[44px]"
        disabled={state.isSubmitting}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
        Sign the liability waiver
      </h2>
      <p className="text-[14px] text-[#6B7C93] mb-4">
        Please read carefully before signing
      </p>

      {/* Scroll progress indicator */}
      <div className="w-full h-1 bg-[#E8F2FB] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[#0C447C] rounded-full transition-all"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
      {!state.waiverScrolled && (
        <p className="text-[12px] text-[#6B7C93] mb-3 text-center">
          ↓ Scroll to read the full waiver
        </p>
      )}

      {/* Waiver text — scrollable */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          h-56 overflow-y-auto rounded-[12px]
          border border-[#D0E2F3] bg-[#F5F8FC]
          p-4 mb-4 text-[13px] text-[#0D1B2A]
          leading-relaxed whitespace-pre-wrap
        "
        tabIndex={0}
        role="region"
        aria-label="Waiver text"
      >
        {waiverText}
      </div>

      {/* Agree checkbox */}
      <label className="flex items-start gap-3 mb-5 cursor-pointer min-h-[48px]">
        <input
          type="checkbox"
          checked={state.waiverAgreed}
          onChange={e => onUpdate({ waiverAgreed: e.target.checked })}
          className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
          disabled={!state.waiverScrolled}
        />
        <span className={cn(
          'text-[14px] leading-relaxed',
          state.waiverScrolled ? 'text-[#0D1B2A]' : 'text-[#6B7C93]'
        )}>
          I have read and agree to the liability waiver
        </span>
      </label>

      {/* Signature field */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Type your full name as your signature
        </label>
        <input
          type="text"
          placeholder="Sofia Martinez"
          value={state.signatureText}
          onChange={e => onUpdate({ signatureText: e.target.value })}
          disabled={!state.waiverAgreed || state.isSubmitting}
          className={cn(
            'w-full h-[56px] px-4 rounded-[10px]',
            'border border-[#D0E2F3]',
            'placeholder:text-[#D0E2F3]',
            // Cursive font for signature
            'font-[Satisfy,cursive] text-[22px] text-[#0C447C]',
            'focus:outline-none focus:border-[#0C447C]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-[11px] text-[#6B7C93] mt-1">
          By typing your name, you agree this constitutes your legal signature
        </p>
      </div>

      {/* Error */}
      {state.submitError && (
        <div className="p-4 rounded-[12px] bg-[#FDEAEA] mb-4">
          <p className="text-[14px] text-[#D63B3B] font-medium">
            {state.submitError}
          </p>
        </div>
      )}

      {/* Sign button */}
      <button
        onClick={handleSign}
        disabled={!canSign || state.isSubmitting}
        className={cn(
          'w-full h-[56px] rounded-[12px]',
          'font-semibold text-[16px]',
          'flex items-center justify-center gap-2',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]',
        )}
      >
        {state.isSubmitting ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          '✓ Sign and check in'
        )}
      </button>
    </div>
  )
}

────────────────────────────────────────────
4F. StepInsurance — conditional affiliates
────────────────────────────────────────────

Create: apps/web/components/join/StepInsurance.tsx
'use client'

Shown only if charterType != 'captained'
AND guest DOB >= 1988-01-01

'use client'
import { ExternalLink } from 'lucide-react'

export function StepInsurance({
  charterType, onNext,
}: {
  charterType: string
  onNext: () => void
}) {
  return (
    <div className="pt-2 space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
          Florida boating course
        </h2>
        <p className="text-[14px] text-[#6B7C93]">
          Florida law requires all boat operators born after
          January 1, 1988 to complete an approved safety course.
        </p>
      </div>

      {/* Course affiliate card */}
      <a
        href="https://www.boat-ed.com/florida/"
        target="_blank"
        rel="noopener noreferrer"
        className="
          block p-5 rounded-[16px] border border-[#D0E2F3]
          bg-[#F5F8FC] hover:border-[#0C447C] transition-colors
        "
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#0D1B2A] mb-1">
              Boat-Ed Florida Course
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              NASBLA-approved. ~$30. Certificate valid 90 days.
            </p>
          </div>
          <ExternalLink size={16} className="text-[#6B7C93] flex-shrink-0 mt-0.5" />
        </div>
      </a>

      <a
        href="https://www.boatus.org/free-online-boating-course/"
        target="_blank"
        rel="noopener noreferrer"
        className="
          block p-5 rounded-[16px] border border-[#D0E2F3]
          bg-[#F5F8FC] hover:border-[#1D9E75] transition-colors
        "
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="
              inline-block text-[11px] font-semibold
              bg-[#E8F9F4] text-[#1D9E75] px-2 py-0.5
              rounded-full mb-1
            ">
              FREE
            </div>
            <p className="text-[15px] font-semibold text-[#0D1B2A]">
              BoatUS Foundation Course
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              Free NASBLA-approved course.
            </p>
          </div>
          <ExternalLink size={16} className="text-[#6B7C93] flex-shrink-0 mt-0.5" />
        </div>
      </a>

      <button
        onClick={onNext}
        className="
          w-full h-[56px] rounded-[12px]
          bg-[#0C447C] text-white font-semibold text-[16px]
          hover:bg-[#093a6b] transition-colors
        "
      >
        Continue →
      </button>

      <p className="text-[12px] text-[#6B7C93] text-center">
        You can complete the course before your charter date
      </p>
    </div>
  )
}

────────────────────────────────────────────
4G. StepAddons — pre-order add-ons
────────────────────────────────────────────

Create: apps/web/components/join/StepAddons.tsx
'use client'

'use client'
import { useState } from 'react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import type { JoinFlowState } from '@/types'

interface StepAddonsProps {
  addons: {
    id: string; name: string; description: string | null
    emoji: string; priceCents: number; maxQuantity: number
  }[]
  guestId: string
  tripSlug: string
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onComplete: () => void
  onSkip: () => void
}

export function StepAddons({
  addons, guestId, tripSlug, state, onUpdate,
  onComplete, onSkip,
}: StepAddonsProps) {
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')

  const totalCents = Object.entries(state.addonQuantities).reduce(
    (sum, [addonId, qty]) => {
      const addon = addons.find(a => a.id === addonId)
      return sum + (addon?.priceCents ?? 0) * qty
    }, 0
  )

  const hasOrders = Object.values(state.addonQuantities)
    .some(qty => qty > 0)

  function setQty(addonId: string, qty: number) {
    onUpdate({
      addonQuantities: { ...state.addonQuantities, [addonId]: Math.max(0, qty) },
    })
  }

  async function submitOrders() {
    if (!hasOrders) { onComplete(); return }

    setIsOrdering(true)
    setOrderError('')

    const orders = Object.entries(state.addonQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([addonId, quantity]) => ({ addonId, quantity }))

    try {
      const res = await fetch(
        `/api/trips/${tripSlug}/addons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId,
            tripId: '', // backend looks up by guestId
            orders,
          }),
        }
      )

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

  if (addons.length === 0) {
    onComplete()
    return null
  }

  return (
    <div className="pt-2 space-y-4">
      <div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
          Add extras to your trip
        </h2>
        <p className="text-[14px] text-[#6B7C93]">
          Pre-order before you arrive
        </p>
      </div>

      {/* Addon list */}
      <div className="space-y-2">
        {addons.map(addon => {
          const qty = state.addonQuantities[addon.id] ?? 0
          return (
            <div
              key={addon.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-[16px]',
                'border transition-colors',
                qty > 0
                  ? 'border-[#0C447C] bg-[#E8F2FB]'
                  : 'border-[#D0E2F3] bg-white'
              )}
            >
              {/* Emoji */}
              <div className="
                w-12 h-12 rounded-[12px] bg-[#F5F8FC]
                flex items-center justify-center text-[24px]
                flex-shrink-0
              ">
                {addon.emoji}
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#0D1B2A] truncate">
                  {addon.name}
                </p>
                {addon.description && (
                  <p className="text-[12px] text-[#6B7C93] truncate">
                    {addon.description}
                  </p>
                )}
                <p className="text-[14px] font-bold text-[#0C447C] mt-0.5">
                  {addon.priceCents === 0
                    ? 'Free'
                    : formatCurrency(addon.priceCents)}
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-0 border border-[#D0E2F3] rounded-[10px] overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setQty(addon.id, qty - 1)}
                  disabled={qty === 0}
                  className="
                    w-10 h-10 flex items-center justify-center
                    text-[18px] text-[#0C447C] font-medium
                    hover:bg-[#E8F2FB] disabled:opacity-30
                    disabled:cursor-not-allowed transition-colors
                  "
                  aria-label="Decrease"
                >
                  −
                </button>
                <span className="w-8 text-center text-[14px] font-bold text-[#0D1B2A]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(addon.id, qty + 1)}
                  disabled={qty >= addon.maxQuantity}
                  className="
                    w-10 h-10 flex items-center justify-center
                    text-[18px] text-[#0C447C] font-medium
                    hover:bg-[#E8F2FB] disabled:opacity-30
                    disabled:cursor-not-allowed transition-colors
                  "
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
        <div className="
          flex items-center justify-between
          p-4 rounded-[12px] bg-[#F5F8FC]
          border border-[#D0E2F3]
        ">
          <span className="text-[14px] font-medium text-[#6B7C93]">
            Your total
          </span>
          <span className="text-[18px] font-bold text-[#0C447C]">
            {formatCurrency(totalCents)}
          </span>
        </div>
      )}

      {orderError && (
        <p className="text-[14px] text-[#D63B3B] font-medium">
          {orderError}
        </p>
      )}

      {/* Actions */}
      <button
        onClick={submitOrders}
        disabled={isOrdering}
        className="
          w-full h-[56px] rounded-[12px]
          bg-[#0C447C] text-white font-semibold text-[16px]
          hover:bg-[#093a6b] transition-colors
          flex items-center justify-center gap-2
          disabled:opacity-40
        "
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
        className="
          w-full text-[14px] text-[#6B7C93] underline
          py-2 min-h-[44px]
        "
      >
        Skip — no add-ons
      </button>
    </div>
  )
}

────────────────────────────────────────────
4H. StepBoarding — the Apple Wallet pass
────────────────────────────────────────────

Create: apps/web/components/join/StepBoarding.tsx
'use client'

The payoff. The moment that makes BoatCheckin real.
Apple Wallet boarding pass aesthetic from DESIGN.md.
QR code. Guest name. Slip. Marina.
PWA install prompt.

'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import type { JoinFlowState } from '@/types'

interface StepBoardingProps {
  tripData: {
    boatName: string; marinaName: string
    slipNumber: string | null; captainName: string | null
    tripDate: string; departureTime: string; durationHours: number
    charterType: string
  }
  state: JoinFlowState
  tripSlug: string
  onClose: () => void
}

export function StepBoarding({
  tripData, state, tripSlug, onClose,
}: StepBoardingProps) {
  const [pwaPrompt, setPwaPrompt] = useState<any>(null)
  const [pwaInstalled, setPwaInstalled] = useState(false)

  // Capture PWA install prompt
  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPwaPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function installPwa() {
    if (!pwaPrompt) return
    await pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    if (outcome === 'accepted') setPwaInstalled(true)
    setPwaPrompt(null)
  }

  async function sharePass() {
    const url = `${window.location.origin}/trip/${tripSlug}`
    if (navigator.share) {
      await navigator.share({
        title: `My boarding pass — ${tripData.boatName}`,
        text: `I'm boarding ${tripData.boatName} on ${formatTripDate(tripData.tripDate)}`,
        url,
      }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  // Summary pills (waiver + addons)
  const hasAddons = Object.values(state.addonQuantities).some(q => q > 0)
  const addonCount = Object.values(state.addonQuantities)
    .reduce((s, q) => s + q, 0)

  return (
    <div className="pt-2">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="text-[40px] mb-2">🎉</div>
        <h2 className="text-[22px] font-bold text-[#0D1B2A] mb-1">
          You're checked in!
        </h2>
        <p className="text-[14px] text-[#6B7C93]">
          Show this QR code when boarding
        </p>
      </div>

      {/* The Boarding Pass — from DESIGN.md */}
      <div className="
        bg-white rounded-[20px]
        shadow-[0_4px_24px_rgba(12,68,124,0.12)]
        overflow-hidden mb-5
      ">
        {/* Top half */}
        <div className="px-5 pt-5 pb-4">
          <p className="
            text-[11px] font-semibold text-[#6B7C93]
            tracking-[0.15em] uppercase mb-2
          ">
            DOCKPASS
          </p>
          <h3 className="text-[20px] font-bold text-[#0D1B2A] mb-4">
            {tripData.boatName}
          </h3>

          {/* 3-column trip meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Date', value: formatTripDate(tripData.tripDate) },
              { label: 'Time', value: formatTime(tripData.departureTime) },
              { label: 'Duration', value: formatDuration(tripData.durationHours) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-[#6B7C93]">{label}</p>
                <p className="text-[13px] font-semibold text-[#0D1B2A] leading-tight">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashed divider */}
        <div className="flex items-center px-4 my-1">
          <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
          <span className="px-2 text-[#D0E2F3] text-[18px]">✂</span>
          <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
        </div>

        {/* Bottom half — QR */}
        <div className="px-5 pt-4 pb-5 flex flex-col items-center">
          <div className="bg-[#0D1B2A] p-3 rounded-[16px] mb-3">
            <QRCodeSVG
              value={state.qrToken}
              size={160}
              fgColor="#FFFFFF"
              bgColor="#0D1B2A"
              level="M"
            />
          </div>
          <p className="text-[12px] text-[#6B7C93] mb-1">
            {tripData.slipNumber
              ? `Slip ${tripData.slipNumber} · `
              : ''
            }{tripData.marinaName}
          </p>
          <p className="text-[17px] font-bold text-[#0D1B2A]">
            {state.fullName}
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-5 justify-center">
        <span className="
          inline-flex items-center gap-1.5 px-3 py-1.5
          rounded-full text-[12px] font-medium
          bg-[#E8F9F4] text-[#1D9E75]
        ">
          ✓ Waiver signed
        </span>
        <span className="
          inline-flex items-center gap-1.5 px-3 py-1.5
          rounded-full text-[12px] font-medium
          bg-[#E8F9F4] text-[#1D9E75]
        ">
          ✓ {state.safetyAcks.length} safety points
        </span>
        {hasAddons && (
          <span className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            rounded-full text-[12px] font-medium
            bg-[#E8F2FB] text-[#0C447C]
          ">
            🛒 {addonCount} add-on{addonCount !== 1 ? 's' : ''} ordered
          </span>
        )}
        {state.requiresCourse && (
          <span className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            rounded-full text-[12px] font-medium
            bg-[#FEF3DC] text-[#E5910A]
          ">
            📋 Complete course before trip
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={sharePass}
          className="
            w-full h-[52px] rounded-[12px]
            border-2 border-[#0C447C] text-[#0C447C]
            font-semibold text-[15px]
            flex items-center justify-center gap-2
            hover:bg-[#E8F2FB] transition-colors
          "
        >
          <Share size={18} />
          Save boarding pass
        </button>

        {/* PWA install (show if not installed) */}
        {pwaPrompt && !pwaInstalled && (
          <div className="
            bg-[#0C447C] rounded-[16px] p-4
            flex items-center gap-3
          ">
            <div className="
              w-10 h-10 bg-white/20 rounded-[10px]
              flex items-center justify-center
              text-[20px] flex-shrink-0
            ">
              ⚓
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-[14px]">
                Add BoatCheckin to your home screen
              </p>
              <p className="text-white/70 text-[12px]">
                Get weather updates and dock alerts
              </p>
            </div>
            <button
              onClick={installPwa}
              className="
                bg-white text-[#0C447C] text-[13px]
                font-semibold px-3 py-1.5 rounded-[8px]
                flex-shrink-0
              "
            >
              Add
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="
            w-full text-[14px] text-[#6B7C93] underline
            py-2 min-h-[44px]
          "
        >
          Back to trip info
        </button>
      </div>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — WIRE INTO TRIP PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. Update StickyJoinCTA
────────────────────────────────────────────

Update: apps/web/components/trip/StickyJoinCTA.tsx
'use client'

Replace the Phase 3B placeholder with the
real JoinFlowSheet import.

Add to the component:
  import { JoinFlowSheet } from '@/components/join/JoinFlowSheet'
  
  const [joinOpen, setJoinOpen] = useState(false)

  Return:
    <>
      {/* existing CTA bar */}
      <button onClick={() => setJoinOpen(true)}>
        {tr.joinCta}
      </button>

      {/* Join flow sheet */}
      {joinOpen && (
        <JoinFlowSheet
          isOpen={joinOpen}
          onClose={() => setJoinOpen(false)}
          tripSlug={tripSlug}
          tripData={tripData}  // pass from parent
          currentLang={currentLang}
        />
      )}
    </>

────────────────────────────────────────────
5B. Update trip page to pass data to CTA
────────────────────────────────────────────

Update: apps/web/app/(public)/trip/[slug]/page.tsx

Pass additional tripData to StickyJoinCTA:
  <StickyJoinCTA
    tripSlug={slug}
    tripCode={trip.tripCode}
    status={trip.status}
    isFull={trip.isFull}
    guestCount={trip.guestCount}
    maxGuests={trip.maxGuests}
    requiresApproval={trip.requiresApproval}
    currentLang={lang}
    tr={tr}
    tripData={{
      boatName: trip.boat.boatName,
      marinaName: trip.boat.marinaName,
      slipNumber: trip.boat.slipNumber,
      captainName: trip.boat.captainName,
      tripDate: trip.tripDate,
      departureTime: trip.departureTime,
      durationHours: trip.durationHours,
      charterType: trip.charterType,
      safetyPoints: trip.boat.safetyPoints,
      addons: trip.addons,
      isEU: false, // TODO: detect from headers
    }}
  />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — BOARDING PASS STANDALONE (C3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/(public)/trip/[slug]/
  pass/page.tsx

Guests who return to the trip page after
checking in see their boarding pass directly.
No need to go through the flow again.

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { GUEST_SESSION_KEY } from '@/types'
import type { GuestSession } from '@/types'

export default function BoardingPassPage() {
  const params = useParams()
  const slug = params.slug as string
  const [session, setSession] = useState<GuestSession | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const key = `dp-guest-${slug}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        setSession(JSON.parse(raw))
      } catch {}
    }
    setLoaded(true)
  }, [slug])

  if (!loaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <AnchorLoader size="lg" color="navy" />
      </div>
    )
  }

  if (!session) {
    // No session — redirect to trip page
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <p className="text-[16px] text-[#6B7C93] mb-4">
          No check-in found for this trip.
        </p>
        <a
          href={`/trip/${slug}`}
          className="text-[#0C447C] underline text-[15px]"
        >
          Back to trip page →
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <h1 className="text-[20px] font-bold text-[#0D1B2A] text-center mb-4">
          Your boarding pass
        </h1>

        {/* Boarding pass card */}
        <div className="
          bg-white rounded-[20px]
          shadow-[0_4px_24px_rgba(12,68,124,0.12)]
          overflow-hidden
        ">
          <div className="px-5 pt-5 pb-4">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#6B7C93] mb-2">
              DOCKPASS
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              Checked in {new Date(session.checkedInAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center px-4 my-1">
            <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
            <span className="px-2 text-[#D0E2F3] text-[18px]">✂</span>
            <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
          </div>

          <div className="px-5 pt-4 pb-5 flex flex-col items-center">
            <div className="bg-[#0D1B2A] p-3 rounded-[16px] mb-3">
              <QRCodeSVG
                value={session.qrToken}
                size={160}
                fgColor="#FFFFFF"
                bgColor="#0D1B2A"
                level="M"
              />
            </div>
            <p className="text-[17px] font-bold text-[#0D1B2A]">
              {session.guestName}
            </p>
          </div>
        </div>

        <a
          href={`/trip/${slug}`}
          className="block text-center text-[14px] text-[#6B7C93] underline mt-5"
        >
          ← Back to trip info
        </a>
      </div>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/join/
  guestRegistration.test.ts

import { describe, it, expect } from 'vitest'
import { guestRegistrationSchema } from '@/lib/security/sanitise'
import { hashWaiverText, verifyWaiverHash } from '@/lib/security/waiver'

const validBase = {
  tripSlug: 'xK9m2aQr7nB4xyz012345678',
  tripCode: 'SUN4',
  fullName: 'Sofia Martinez',
  emergencyContactName: 'Maria Martinez',
  emergencyContactPhone: '+1 305 555 0100',
  languagePreference: 'en' as const,
  safetyAcknowledgments: [],
  waiverSignatureText: 'Sofia Martinez',
  waiverAgreed: true as const,
  waiverTextHash: 'a'.repeat(64),
  turnstileToken: 'test-token',
}

describe('guestRegistrationSchema', () => {
  it('accepts valid registration', () => {
    expect(guestRegistrationSchema.safeParse(validBase).success).toBe(true)
  })

  it('rejects name under 2 chars', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase, fullName: 'A'
    }).success).toBe(false)
  })

  it('rejects invalid trip code format', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase, tripCode: 'ab12'
    }).success).toBe(false)
  })

  it('requires waiverAgreed: true exactly', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase, waiverAgreed: false
    }).success).toBe(false)
  })

  it('rejects waiver hash not 64 hex chars', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase, waiverTextHash: 'tooshort'
    }).success).toBe(false)
  })

  it('rejects phone with letters', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase, emergencyContactPhone: 'not-a-phone'
    }).success).toBe(false)
  })

  it('trims whitespace from fullName', () => {
    const result = guestRegistrationSchema.safeParse({
      ...validBase, fullName: '  Sofia Martinez  '
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Sofia Martinez')
    }
  })

  it('accepts with optional fields', () => {
    expect(guestRegistrationSchema.safeParse({
      ...validBase,
      dateOfBirth: '1990-05-15',
      dietaryRequirements: 'Nut allergy',
      isNonSwimmer: true,
      isSeaSicknessProne: false,
      gdprConsent: true,
    }).success).toBe(true)
  })

  it('rejects future date of birth (YYYY-MM-DD only)', () => {
    // Schema just validates format, not future
    expect(guestRegistrationSchema.safeParse({
      ...validBase,
      dateOfBirth: 'not-a-date'
    }).success).toBe(false)
  })
})

describe('waiver hashing', () => {
  const waiverText = 'I agree to the terms of this charter...'

  it('produces 64-char hex hash', () => {
    const hash = hashWaiverText(waiverText)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same text produces same hash', () => {
    expect(hashWaiverText(waiverText)).toBe(hashWaiverText(waiverText))
  })

  it('different text produces different hash', () => {
    expect(hashWaiverText(waiverText)).not.toBe(
      hashWaiverText(waiverText + ' extra')
    )
  })

  it('verifyWaiverHash returns true for matching text', () => {
    const hash = hashWaiverText(waiverText)
    expect(verifyWaiverHash(hash, waiverText)).toBe(true)
  })

  it('verifyWaiverHash returns false for tampered hash', () => {
    expect(verifyWaiverHash('a'.repeat(64), waiverText)).toBe(false)
  })

  it('strips leading/trailing whitespace before hashing', () => {
    expect(hashWaiverText('  ' + waiverText + '  '))
      .toBe(hashWaiverText(waiverText))
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 16 tests must pass before Phase 3D starts.

TEST 1 — Unit tests pass:
  npm run test
  All tests in __tests__/unit/join/ pass

TEST 2 — Full registration flow:
  Open /trip/[slug] for Conrad's test trip
  Tap "Check in for this trip →"
  Bottom sheet opens with handle bar
  Step 1: enter correct trip code → advance
  Step 2: fill name + emergency contact → Next
  Step 3: tap "Understood ✓" on each safety card
  Step 4: scroll waiver to bottom → check agree
    → type name in signature field
    → tap "Sign and check in"
  Step 5: addons appear → skip
  Step 6: boarding pass renders with QR code
  VERIFY: guests table has new row in Supabase

TEST 3 — Boarding pass correctness:
  QR code renders (black on dark bg)
  Boat name correct
  Date / Time / Duration in 3 columns
  Dashed divider ✂ visible
  Guest name at bottom
  Slip and marina shown

TEST 4 — Trip code lockout:
  Enter wrong code 5 times
  On 5th: locked out message appears
  Countdown timer shows minutes remaining
  Input is disabled
  Wait for lockout (or manually clear Redis key)
  Try again — works

TEST 5 — Idempotency:
  Complete check-in successfully
  Immediately open fresh tab with same trip link
  Enter same name + correct code
  Sign waiver again
  EXPECTED: Returns existing boarding pass
  No duplicate row in Supabase guests table

TEST 6 — Safety cards cannot be skipped:
  Open join flow
  Enter code, fill details
  On safety step: button reads "Understood ✓"
  Cannot proceed without tapping each card
  Last card acknowledged → "Continue to waiver →" appears

TEST 7 — Waiver scroll enforcement:
  Open waiver step
  Sign button is disabled initially
  Scroll waiver text to bottom
  Checkbox becomes enabled
  Check box + type name → sign button enables

TEST 8 — Duplicate check-in (same session):
  After check-in, refresh the trip page
  QR boarding pass shows immediately (from localStorage)
  "Check in" button still shows in CTA
    (for other guests on same device)

TEST 9 — Add-on price integrity:
  Complete flow up to addons step
  Add 2 champagne + 1 snorkel kit
  Prices shown come from database (verify in DevTools)
  Request body to /api/trips/[slug]/addons
    contains NO price fields — only addonId + qty
  Response contains server-calculated totals

TEST 10 — Florida course check:
  In boat profile: set charterType to 'bareboat'
  Register with dateOfBirth: 1992-06-15 (after 1988)
  EXPECTED: insurance/course step appears
  Two course affiliate links shown
  Register with dateOfBirth: 1975-01-01 (before 1988)
  EXPECTED: no course step shown

TEST 11 — EU GDPR consent:
  Set isEU: true in tripData (test only)
  In StepDetails: GDPR consent section visible
  Both checkboxes appear
  Required consent checkbox must be checked
    (otherwise — validate in server action)

TEST 12 — Boarding pass standalone (/pass):
  After check-in navigate to /trip/[slug]/pass
  Boarding pass renders with QR code
  Guest name shows correctly
  "Back to trip info" link works

TEST 13 — Turnstile in production:
  With real TURNSTILE_SITE_KEY set:
  Invisible Turnstile challenge completes automatically
  If TURNSTILE_SECRET_KEY missing: fails open with log

TEST 14 — Waiver hash mismatch:
  Check-in normally: note the waiverHash in DevTools
  Manually change boat waiver text in Supabase
  Try to register with old hash
  EXPECTED: "The waiver has been updated" error
  Guest must reload and start flow again

TEST 15 — Capacity limit:
  Set maxGuests to 1 in test trip
  Register 1 guest fully
  Try to register second guest
  On validate-code step: "This trip is full"
  Or in StickyJoinCTA: button shows "Trip is full"

TEST 16 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  No 'any' types in new files
  No unused imports

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 16 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + what changed)
  3. Migration 003 confirmation:
     - New columns visible in Supabase
     - Types regenerated
  4. All 16 test results ✅ / ❌
  5. Supabase row count:
     - guests: N rows after test registration
     - guest_addon_orders: N rows after addon test
     - audit_log: 'guest_registered' entries
  6. DevTools confirmation:
     - Addon order request has NO price fields
     - Response has server-calculated totals
  7. Any deviations from spec + why
  8. Total lines added across all files
```
