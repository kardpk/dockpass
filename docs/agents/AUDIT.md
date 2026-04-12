# BoatCheckin — Security & Architecture Audit
# @AUDIT
# Conducted: April 2026
# Status: MUST READ before Session 2

---

## AUDIT SUMMARY

```
Critical issues found:     6   ← fix before any code
High issues found:         8   ← fix in session 2
Medium issues found:       7   ← fix before launch
Low issues found:          5   ← fix before scale

New files created:
  AUDIT.md          ← this file
  DEPENDENCIES.md   ← complete pinned package list
  INFRA_SETUP.md    ← step-by-step service creation
```

---

## PART 1 — CRITICAL ISSUES (fix before writing code)

---

### CRITICAL 1 — Next.js 15 Breaking Changes Not Handled

**Problem:**
SECURITY.md and FRONTEND.md have code written
for Next.js 14. Next.js 15 has breaking changes
that will cause silent failures and security gaps.

**Specific broken code in auth.ts:**
```typescript
// BROKEN — Next.js 15 requires await
const cookieStore = cookies()        // ← crashes in Next.js 15

// FIXED
const cookieStore = await cookies()  // ← correct
```

**All affected files:**
```
SECURITY.md  → requireOperator() function
FRONTEND.md  → any cookies() usage
BACKEND.md   → any headers() usage
```

**Fix — update requireOperator():**
```typescript
// lib/security/auth.ts — CORRECTED for Next.js 15
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireOperator() {
  const cookieStore = await cookies() // ← MUST await in Next.js 15

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: operator } = await supabase
    .from('operators')
    .select('id, subscription_status, subscription_tier, is_active, max_boats')
    .eq('id', user.id)
    .single()

  if (!operator?.is_active) redirect('/login?error=account_inactive')

  return { user, operator, supabase }
}
```

**Fix — Page params are now async:**
```typescript
// ALL pages with [slug], [id] params — MUST await
export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }> // Promise wrapper required
}) {
  const { slug } = await params     // MUST await
  // ...
}
```

---

### CRITICAL 2 — CSP Blocks Mapbox + Supabase Realtime

**Problem:**
Current Content-Security-Policy in SECURITY.md
blocks Mapbox tiles, Supabase Realtime WebSocket,
and Cloudflare push notifications. App will have
broken maps and broken realtime on deploy.

**Current broken CSP:**
```typescript
"connect-src 'self' https://*.supabase.co https://api.open-meteo.com"
// Missing: Mapbox, Supabase WebSocket, Twilio, push endpoints
```

**Fixed CSP — replaces section 8 in SECURITY.md:**
```typescript
// middleware.ts — CORRECTED CSP
const csp = [
  "default-src 'self'",
  // Scripts — Next.js needs unsafe-inline for hydration
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com",
  // Styles
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  // Images — Mapbox tiles + Supabase storage + user uploads
  "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Connections — ALL external services
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",           // Supabase Realtime WebSocket
    "https://api.open-meteo.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",     // Mapbox telemetry
    "https://api.stripe.com",
    "https://api.resend.com",
    "https://api.twilio.com",
    "https://api.apify.com",
    "https://api.buoy.insure",
  ].join(' '),
  // Workers — Mapbox uses Web Workers
  "worker-src 'self' blob:",
  // Frames — Stripe Elements iframe
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

response.headers.set('Content-Security-Policy', csp)
```

---

### CRITICAL 3 — Supabase RLS Has Dangerous Gap

**Problem:**
Current DATABASE.md RLS policy for guests
allows ANY anonymous user to read guest records
if deleted_at IS NULL. This leaks all guest data.

**Current broken policy:**
```sql
-- DANGEROUS — exposes all guest data
CREATE POLICY "guests_read_own" ON guests
  FOR SELECT USING (
    auth.uid() = operator_id
    OR deleted_at IS NULL  -- ← THIS IS WRONG
  );
```

**Fixed policy:**
```sql
-- Operators see their guests
CREATE POLICY "guests_operator_reads" ON guests
  FOR SELECT
  USING (auth.uid() = operator_id);

-- Guests read ONLY their own record via QR token
-- This is handled in API layer (not RLS)
-- because guests have no auth session
-- API fetches by qr_token server-side with service client

-- Anonymous can INSERT (registration) but not SELECT
CREATE POLICY "guests_anonymous_insert" ON guests
  FOR INSERT
  WITH CHECK (
    -- Trip must exist and not be cancelled
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.status != 'cancelled'
    )
  );

-- Operators can UPDATE approval status only
CREATE POLICY "guests_operator_approves" ON guests
  FOR UPDATE
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- Nobody can DELETE guest records (soft-delete only)
-- Deletion happens via GDPR function with service role
```

---

### CRITICAL 4 — Missing Idempotency on Guest Registration

**Problem:**
If a guest submits registration form twice (double
tap, network retry, browser back button), two
guest records are created. Operator sees duplicates.
Manifest PDF is wrong. QR codes conflict.

**Fix — add idempotency check in registration:**
```typescript
// In registration Server Action / API route
// BEFORE inserting guest:

// Check for existing registration
const { data: existing } = await supabase
  .from('guests')
  .select('id, qr_token, created_at')
  .eq('trip_id', tripId)
  .ilike('full_name', fullName.trim())
  .is('deleted_at', null)
  .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
  // Within last 15 minutes = same person
  .single()

if (existing) {
  // Return existing registration silently
  // Don't create duplicate
  return {
    guestId: existing.id,
    qrToken: existing.qr_token,
    isDuplicate: true,
  }
}
// Proceed with insert only if no duplicate found
```

---

### CRITICAL 5 — Slide to Start Trip Has No Double-Start Protection

**Problem:**
If captain taps the Start Trip button twice
(network lag, accidental double swipe), the
Buoy API fires twice. Two insurance policies
created. Trip starts twice. Data corrupted.

**Fix — Redis distributed lock:**
```typescript
// In Start Trip Server Action
const lockKey = `lock:trip:start:${tripId}`

// Try to acquire lock (atomic, 30 second TTL)
const acquired = await redis.set(
  lockKey,
  '1',
  { ex: 30, nx: true } // nx = only set if not exists
)

if (!acquired) {
  // Lock exists = trip already being started
  return { error: 'Trip start in progress', alreadyStarting: true }
}

try {
  // Check trip isn't already active
  const { data: trip } = await supabase
    .from('trips')
    .select('status, started_at')
    .eq('id', tripId)
    .single()

  if (trip?.status === 'active') {
    return { success: true, alreadyStarted: true }
  }

  // Proceed with start...
  await supabase.from('trips').update({ status: 'active' })
  await activateBuoyPolicy(tripId)
  // ...

} finally {
  // Always release lock
  await redis.del(lockKey)
}
```

---

### CRITICAL 6 — QR Token Has No Expiry

**Problem:**
Current QR tokens in SECURITY.md never expire.
A guest who attended a trip in 2024 could
technically reuse their QR token to pretend
to board a 2025 trip if they know the system.

**Fix — add expiry to QR token:**
```typescript
// lib/security/tokens.ts — UPDATED
export function generateQRToken(
  guestId: string,
  tripId: string,
  tripDate: string // 'YYYY-MM-DD'
): string {
  // Token expires at midnight after trip date + 1 day
  const expiresAt = new Date(tripDate)
  expiresAt.setDate(expiresAt.getDate() + 1)
  const expiry = Math.floor(expiresAt.getTime() / 1000)

  const payload = `${guestId}:${tripId}:${expiry}`
  const hmac = createHmac('sha256', process.env.QR_HMAC_SECRET!)
  hmac.update(payload)
  const signature = hmac.digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

export function verifyQRToken(token: string): {
  guestId: string
  tripId: string
  expired: boolean
} | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const hmac = createHmac('sha256', process.env.QR_HMAC_SECRET!)
    hmac.update(payload)
    const expectedSig = hmac.digest('base64url')

    if (!timingSafeEqual(signature, expectedSig)) return null

    const [guestId, tripId, expiryStr] = payload.split(':')
    const expiry = parseInt(expiryStr ?? '0')
    const expired = Date.now() / 1000 > expiry

    return { guestId: guestId!, tripId: tripId!, expired }
  } catch {
    return null
  }
}
```

---

## PART 2 — HIGH ISSUES (fix in session 2)

---

### HIGH 1 — Missing Zod Schemas for Operator Inputs

**Problem:**
SECURITY.md only has Zod schema for guest
registration and addon orders. Operator-side
inputs (boat creation, trip creation) have
no defined schemas. XSS vector is open.

**Add these schemas to sanitise.ts:**
```typescript
export const boatSetupSchema = z.object({
  boatName: z.string().min(2).max(100),
  boatType: z.enum(['yacht','catamaran','motorboat',
    'sailboat','pontoon','fishing','speedboat','other']),
  charterType: z.enum(['captained','bareboat','both']),
  yearBuilt: z.number().int().min(1950).max(2026).optional(),
  lengthFt: z.number().min(10).max(500).optional(),
  maxCapacity: z.number().int().min(1).max(500),
  marinaName: z.string().min(2).max(200),
  marinaAddress: z.string().min(5).max(500),
  slipNumber: z.string().max(20).optional(),
  parkingInstructions: z.string().max(1000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  captainName: z.string().min(2).max(100).optional(),
  captainBio: z.string().max(1000).optional(),
  captainLicense: z.string().max(50).optional(),
  captainLanguages: z.array(
    z.enum(['en','es','pt','fr','de','it','ru'])
  ).max(7).optional(),
  whatToBring: z.string().max(2000).optional(),
  houseRules: z.string().max(2000).optional(),
  waiverText: z.string().min(100).max(10000),
  cancellationPolicy: z.string().max(1000).optional(),
  boatsetterUrl: z.string().url().optional(),
})

export const tripCreationSchema = z.object({
  boatId: z.string().uuid(),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationHours: z.number().min(0.5).max(24),
  maxGuests: z.number().int().min(1).max(500),
  bookingType: z.enum(['private','split']),
  requiresApproval: z.boolean(),
  tripCode: z.string().regex(/^[A-Z0-9]{4}$/).optional(),
  specialNotes: z.string().max(500).optional(),
  charterType: z.enum(['captained','bareboat','both']),
})

export const addonSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  emoji: z.string().max(4).optional(),
  priceCents: z.number().int().min(0).max(100000),
  maxQuantity: z.number().int().min(1).max(100),
})
```

---

### HIGH 2 — Rate Limiting Race Condition

**Problem:**
Current rate limiter uses INCR + EXPIRE
as two separate Redis commands. If server
crashes between the two commands, the key
never expires = permanent lockout for that IP.

**Fix — use Lua script for atomicity:**
```typescript
// lib/security/rate-limit.ts — ATOMIC VERSION
export async function rateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<{ blocked: boolean; remaining: number }> {
  const ip = getClientIP(req)
  const key = `rate:${config.key ?? new URL(req.url).pathname}:${ip}`

  // Atomic Lua script: INCR + EXPIRE in one operation
  const luaScript = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return current
  `

  const count = await redis.eval(
    luaScript,
    [key],
    [config.window.toString()]
  ) as number

  return {
    blocked: count > config.max,
    remaining: Math.max(0, config.max - count),
  }
}

// Better IP extraction
function getClientIP(req: Request): string {
  const cfIP = req.headers.get('cf-connecting-ip')    // Cloudflare
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')

  if (cfIP) return cfIP
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim()
  if (realIP) return realIP
  return 'unknown'
}
```

---

### HIGH 3 — Missing Cloudflare Turnstile (Bot Protection)

**Problem:**
Guest registration has rate limiting but no
bot detection. A bot can still register fake
guests on real trips by cycling IPs.

**Fix — add Cloudflare Turnstile (free):**
```typescript
// 1. Add to join flow Step 1 (trip code page)
// components/join/StepCode.tsx
import { Turnstile } from '@marsidev/react-turnstile'

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
  options={{ theme: 'light', size: 'invisible' }}
/>

// 2. Verify server-side before registration
// lib/security/turnstile.ts
export async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )
  const data = await res.json()
  return data.success === true
}

// 3. Add to env variables:
// NEXT_PUBLIC_TURNSTILE_SITE_KEY=
// TURNSTILE_SECRET_KEY=
// Both free at dash.cloudflare.com
```

---

### HIGH 4 — Missing Request Size Limits

**Problem:**
No limit on request body size. An attacker
can send a 100MB JSON payload to any endpoint,
causing memory exhaustion on the serverless function.

**Fix — add to Next.js config:**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Server Actions max body
    },
  },
  // API routes have no built-in limit in Next.js 15
  // Use middleware to reject large requests
}

// middleware.ts — add size check
export function middleware(request: NextRequest) {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    // Reject requests over 10MB
    return new NextResponse('Request too large', { status: 413 })
  }
  // ... rest of middleware
}
```

---

### HIGH 5 — Supabase Service Role Key Exposure Risk

**Problem:**
BACKEND.md uses `createServiceClient()` in
multiple API routes. If this pattern is used
incorrectly in a client component, the service
role key (which bypasses ALL RLS) gets exposed.

**Fix — hard enforcement pattern:**
```typescript
// lib/supabase/service.ts
// This file must NEVER be imported in client components

import { createClient } from '@supabase/supabase-js'

// Guard against accidental client-side import
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY: lib/supabase/service.ts imported on client. ' +
    'This file contains the service role key. ' +
    'Use lib/supabase/browser.ts in client components.'
  )
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// lib/supabase/browser.ts — safe for client components
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // anon only
  )
}
```

---

### HIGH 6 — Missing Audit Log for Sensitive Operations

**Problem:**
DATABASE.md has an audit_log table but
SECURITY.md and BACKEND.md never call it.
Critical operations like trip start, waiver
signing, and GDPR deletion have no audit trail.

**Fix — add audit helper:**
```typescript
// lib/security/audit.ts
import { createServiceClient } from '@/lib/supabase/service'

type AuditAction =
  | 'guest_registered'
  | 'waiver_signed'
  | 'trip_started'
  | 'trip_ended'
  | 'gdpr_deletion'
  | 'operator_login'
  | 'qr_scanned'
  | 'addon_ordered'
  | 'approval_granted'
  | 'approval_denied'

export async function auditLog(params: {
  action: AuditAction
  operatorId?: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = createServiceClient()

  // Non-blocking — audit failures never break main flow
  supabase.from('audit_log').insert({
    action: params.action,
    operator_id: params.operatorId ?? null,
    entity_type: params.entityType,
    entity_id: params.entityId,
    changes: params.changes ?? {},
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent?.slice(0, 500) ?? null,
  }).then().catch((err) => {
    console.error('[audit] failed to log:', err)
    // Never throw — audit is observability, not functionality
  })
}
```

---

### HIGH 7 — Missing CORS Configuration

**Problem:**
No explicit CORS headers. The Buoy API and
Tint.ai webhooks POST to your endpoints.
Without CORS config, some requests may fail
or be over-permissive.

**Fix — add to middleware.ts:**
```typescript
// Webhook endpoints need different CORS than normal routes
const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',
  '/api/webhooks/buoy',
  '/api/webhooks/tint',
]

const ALLOWED_ORIGINS = [
  'https://boatcheckin.com',
  'https://www.boatcheckin.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
].filter(Boolean)

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const origin = request.headers.get('origin') ?? ''
  const isWebhook = WEBHOOK_PATHS.some(p =>
    request.nextUrl.pathname.startsWith(p)
  )

  if (isWebhook) {
    // Webhooks: allow from Stripe/Buoy/Tint servers
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers',
    'Content-Type, Authorization, stripe-signature'
  )

  // Preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  return response
}
```

---

### HIGH 8 — Mapbox Token Needs Scope Restriction

**Problem:**
If the Mapbox public token is too permissive,
an attacker who finds it can use it to make
API calls on your billing account.

**Fix — restrict token in Mapbox dashboard:**
```
1. Go to account.mapbox.com/access-tokens
2. Create a NEW token (not the default public one)
3. Set allowed URLs:
   https://boatcheckin.com
   https://www.boatcheckin.com
   http://localhost:3000 (dev token only)
4. Allowed scopes: styles:read, tiles:read
   (READ only — no create/delete permissions)
5. Use this restricted token as NEXT_PUBLIC_MAPBOX_TOKEN
6. NEVER use the secret token on frontend

This limits damage if token is ever scraped
from frontend source code.
```

---

## PART 3 — MEDIUM ISSUES

---

### MEDIUM 1 — dependency-audit: Outdated Package Versions

**Problem:**
SECURITY.md specifies `stripe: "^14.0.0"` but
Stripe is on v17+. Specifying `^14` will install
v14 which has known security patches missing.
Same issue with several other packages.

**Fix — see DEPENDENCIES.md (new file)**
All packages pinned to exact current versions.

---

### MEDIUM 2 — Missing Security.txt

**Problem:**
Security researchers who find vulnerabilities
have no way to report them responsibly. This
is a basic industry standard.

**Fix — create public/security.txt:**
```
Contact: security@boatcheckin.com
Expires: 2027-04-01T00:00:00.000Z
Preferred-Languages: en
Policy: https://boatcheckin.com/security-policy
Acknowledgments: https://boatcheckin.com/security-acknowledgments
```

---

### MEDIUM 3 — Missing Error Boundary for Client Components

**Problem:**
If a client component crashes (Mapbox load
failure, QR generation error), the entire page
crashes without user feedback.

**Fix — add error boundary:**
```typescript
// components/shared/ErrorBoundary.tsx
'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // Log to monitoring (Sentry in phase 2)
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-center">
          <p className="text-[#0C447C] font-medium">
            Something didn't load correctly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm underline text-[#6B7C93]"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

### MEDIUM 4 — Missing Database Connection Pooling Config

**Problem:**
Supabase serverless connections in Next.js
without connection pooling will exhaust
Postgres connections under modest load.

**Fix — add to Supabase client:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          // Connection pooling via Supabase Pooler
          'x-connection-encrypted': 'true',
        },
      },
    }
  )
}
```

Also: In Supabase dashboard → Settings → Database
→ Enable "Connection Pooling" (PgBouncer)
→ Mode: Transaction (best for serverless)
→ Use the pooled connection string in env vars

---

### MEDIUM 5 — Missing TypeScript Path Aliases

**Problem:**
Code across all agent files uses both
`@/lib/...` and relative paths `../../lib/...`
inconsistently. This causes import errors
and makes refactoring risky.

**Fix — add to tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./apps/web/*"],
      "@ui/*": ["./apps/web/components/ui/*"],
      "@lib/*": ["./apps/web/lib/*"],
      "@types/*": ["./apps/web/types/*"],
      "@hooks/*": ["./apps/web/hooks/*"]
    }
  }
}
```

---

### MEDIUM 6 — Worker Has No Health Check

**Problem:**
Render worker (BullMQ) can crash silently.
Jobs queue up but never process. No alert
fires. Operators never get notifications.
Cron jobs never run. GDPR cleanup stops.

**Fix — add health endpoint to worker:**
```typescript
// apps/worker/health.ts
import http from 'http'
import { queues } from './queues'

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    try {
      // Check each queue is responsive
      const queueChecks = await Promise.all(
        Object.entries(queues).map(async ([name, queue]) => {
          const counts = await queue.getJobCounts()
          return { name, ...counts }
        })
      )

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queues: queueChecks,
      }))
    } catch (err) {
      res.writeHead(500)
      res.end(JSON.stringify({ status: 'unhealthy', error: String(err) }))
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(process.env.PORT ?? 3001)
// Render pings /health every 30s
// Restarts worker if 3 consecutive failures
```

---

### MEDIUM 7 — Missing Signed URL Expiry for Supabase Storage

**Problem:**
Captain photos and uploaded files use public
storage URLs that never expire. Anyone with
the URL can access operator photos forever
even after account deletion.

**Fix — use signed URLs for sensitive files:**
```typescript
// lib/supabase/storage.ts
import { createServiceClient } from './service'

export async function getSignedPhotoURL(
  path: string,
  expiresIn = 3600 // 1 hour default
): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.storage
    .from('boat-photos')
    .createSignedUrl(path, expiresIn)

  if (error || !data) {
    throw new Error('Could not generate signed URL')
  }

  return data.signedUrl
}

// Captain photos: 3600s (1 hour)
// Trip manifest PDFs: 300s (5 min)
// Postcard images: 86400s (24 hours for download)
```

---

## PART 4 — LOW ISSUES

---

### LOW 1 — No Staging Environment Defined

Vercel preview URLs are not a proper staging
environment. Add a dedicated staging branch.

```
Branches:
  main       → production (boatcheckin.com)
  staging    → staging (staging.boatcheckin.com)
  develop    → feature work
  feature/*  → PRs into develop

Staging uses separate:
  - Supabase project (staging)
  - Stripe test mode
  - Separate Upstash Redis
  - Real Resend but test domain
```

---

### LOW 2 — Missing robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /snapshot/

Sitemap: https://boatcheckin.com/sitemap.xml
```

---

### LOW 3 — No Dependency Update Policy

Pin all dependencies to exact versions.
Use Dependabot for automated security PRs.
Review and merge weekly.

Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

---

### LOW 4 — Missing Favicon and PWA Icons

Before launch, generate all required icon sizes
at realfavicongenerator.net using the ⚓ anchor
in navy (#0C447C) on white background.

Required sizes:
```
16x16, 32x32 (browser favicon)
180x180 (Apple touch icon)
192x192 (Android PWA)
512x512 (Android splash)
maskable_icon (adaptive icon)
```

---

### LOW 5 — Console.log Left in Security Code

SECURITY.md has `console.error('[webhook] invalid signature:', err)`
This leaks signature validation details to logs.

```typescript
// Replace with:
console.error('[webhook] signature validation failed')
// Never log the actual error object for security endpoints
```

---

## PART 5 — NEW DEPENDENCIES TO ADD

---

### Missing from current package.json

```json
{
  "dependencies": {
    "@marsidev/react-turnstile": "^1.0.2",
    "server-only": "^0.0.1",
    "sharp": "^0.33.4"
  }
}
```

**@marsidev/react-turnstile** — Cloudflare bot protection
**server-only** — Prevents accidental client imports of server modules
**sharp** — Image processing for uploaded captain photos (resize before storage)

---

### Add server-only to service files

```typescript
// Add as FIRST LINE of any server-only file:
import 'server-only'

// Files that need this:
// lib/supabase/service.ts
// lib/security/audit.ts
// lib/stripe/client.ts
// lib/buoy/client.ts
// lib/tint/client.ts
// app/api/**/*.ts (all API routes)
```

This causes a build error if accidentally
imported in a Client Component — the safest
possible protection against key exposure.

---

## PART 6 — ARCHITECTURE IMPROVEMENTS

---

### ARCH 1 — Add Next.js 15 Instrumentation

```typescript
// instrumentation.ts (root of apps/web)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server startup validation
    await import('./lib/config/env')
    // Validates all required env vars exist
    // Crashes loudly if missing — better than silent failure
  }
}
```

---

### ARCH 2 — Add Proper TypeScript Types File

```typescript
// apps/web/types/database.ts
// Generated from Supabase — run after migrations:
// npx supabase gen types typescript --local > apps/web/types/database.ts

// apps/web/types/index.ts
export type TripStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type SubscriptionTier = 'solo' | 'captain' | 'fleet' | 'marina'
export type CharterType = 'captained' | 'bareboat' | 'both'
export type ApprovalStatus = 'pending' | 'approved' | 'declined' | 'auto_approved'
export type BoatType = 'yacht' | 'catamaran' | 'motorboat' | 'sailboat' |
  'pontoon' | 'fishing' | 'speedboat' | 'other'

export interface TripWithBoat {
  id: string
  slug: string
  trip_code: string
  trip_date: string
  departure_time: string
  duration_hours: number
  max_guests: number
  status: TripStatus
  charter_type: CharterType
  boats: BoatProfile
}

export interface BoatProfile {
  boat_name: string
  boat_type: BoatType
  marina_name: string
  marina_address: string
  slip_number: string | null
  parking_instructions: string | null
  lat: number | null
  lng: number | null
  captain_name: string | null
  captain_photo_url: string | null
  captain_bio: string | null
  captain_license: string | null
  captain_languages: string[]
  what_to_bring: string | null
  house_rules: string | null
  waiver_text: string
  cancellation_policy: string | null
  addons: AddonItem[]
}

export interface GuestRecord {
  id: string
  full_name: string
  waiver_signed: boolean
  waiver_signed_at: string | null
  dietary_requirements: string | null
  language_preference: string
  approval_status: ApprovalStatus
  qr_token: string
  addon_orders: AddonOrder[]
}

export interface AddonItem {
  id: string
  name: string
  description: string | null
  emoji: string
  price_cents: number
  max_quantity: number
}

export interface AddonOrder {
  addon_id: string
  quantity: number
  unit_price_cents: number
  total_cents: number
}
```

---

### ARCH 3 — Add next.config.ts Complete Version

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  // Strict TypeScript
  typescript: { tsconfigPath: './tsconfig.json' },

  // Server Actions security
  experimental: {
    serverActions: {
      allowedOrigins: [
        'boatcheckin.com',
        'www.boatcheckin.com',
        'localhost:3000',
      ],
      bodySizeLimit: '2mb',
    },
  },

  // Image domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security: disable powered-by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Redirects
  async redirects() {
    return [
      {
        source: '/t/:slug',
        destination: '/trip/:slug',
        permanent: true,
      },
    ]
  },
}

// Wrap with PWA
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.open-meteo\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'weather-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 3 * 60 * 60, // 3 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'boat-photos',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})(nextConfig)
```

---

## AUDIT COMPLETION CHECKLIST

```
Before Session 2 (database setup):
□ Read DEPENDENCIES.md — install correct versions
□ Read INFRA_SETUP.md — create all accounts
□ Fix CRITICAL 1: Update auth.ts for Next.js 15
□ Fix CRITICAL 2: Update CSP headers
□ Fix CRITICAL 3: Fix RLS guest policies
□ Restrict Mapbox token scope (HIGH 8)
□ Add server-only to service files
□ Create .github/dependabot.yml
□ Create public/security.txt
□ Create public/robots.txt

Before first operator uses the product:
□ Fix CRITICAL 4: Idempotency on registration
□ Fix CRITICAL 5: Redis lock on trip start
□ Fix CRITICAL 6: QR token expiry
□ Fix HIGH 1: Add missing Zod schemas
□ Fix HIGH 2: Atomic rate limiting
□ Fix HIGH 3: Cloudflare Turnstile
□ Fix HIGH 4: Request size limits
□ Fix HIGH 5: Service role guard
□ Fix HIGH 6: Audit log calls
□ Fix HIGH 7: CORS configuration
□ Fix MEDIUM 4: Connection pooling
□ Fix MEDIUM 7: Signed storage URLs

Before scale (100+ operators):
□ Fix MEDIUM 1: Pin all dependency versions
□ Fix MEDIUM 6: Worker health check
□ Add staging environment (LOW 1)
□ Add Sentry error monitoring
□ Load test with k6 or Artillery
```
