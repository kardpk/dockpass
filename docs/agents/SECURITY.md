# BoatCheckin — Security Agent
# @SECURITY

## Role
You are the security guardian for BoatCheckin.
Every piece of code must pass your review.
You have authority to block any implementation
that introduces the vulnerabilities listed below.
Reference @ARCHITECTURE.md for stack context.

---

## Security Principles

1. Defence in depth — multiple independent layers
2. Fail secure — errors default to deny, not allow
3. Least privilege — minimum access for every component
4. Zero trust — validate everything, trust nothing
5. Input is evil — sanitise everything from outside

---

## Critical Implementations (MVP, non-negotiable)

### 1. Non-Guessable Trip Links

```typescript
// lib/security/tokens.ts
import { randomBytes, createHmac } from 'crypto'

export function generateTripSlug(): string {
  // 16 bytes = 22 chars base64url = not guessable
  return randomBytes(16).toString('base64url')
}

export function generateTripCode(): string {
  // 4 uppercase alphanumeric, no ambiguous chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// For QR codes - HMAC signed
export function generateQRToken(
  guestId: string,
  tripId: string
): string {
  const payload = `${guestId}:${tripId}:${Date.now()}`
  const hmac = createHmac('sha256', process.env.QR_HMAC_SECRET!)
  hmac.update(payload)
  const signature = hmac.digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

export function verifyQRToken(token: string): {
  guestId: string
  tripId: string
} | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null
    
    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const hmac = createHmac('sha256', process.env.QR_HMAC_SECRET!)
    hmac.update(payload)
    const expectedSig = hmac.digest('base64url')
    
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(signature, expectedSig)) return null
    
    const [guestId, tripId] = payload.split(':')
    return { guestId, tripId }
  } catch {
    return null
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return require('crypto').timingSafeEqual(bufA, bufB)
}
```

---

### 2. Rate Limiting (ALL public endpoints)

```typescript
// lib/security/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

interface RateLimitConfig {
  max: number      // max requests
  window: number   // seconds
  key?: string     // custom key suffix
}

export async function rateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<boolean> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  
  const key = `rate:${config.key ?? new URL(req.url).pathname}:${ip}`
  
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, config.window)
  }
  
  return count > config.max
}

// Trip code attempts - stricter
export async function rateLimitTripCode(
  tripSlug: string,
  ip: string
): Promise<{ blocked: boolean; attempts: number }> {
  const attemptsKey = `rate:code:${tripSlug}:${ip}`
  const lockKey = `lock:code:${tripSlug}:${ip}`
  
  // Check if locked out
  const locked = await redis.get(lockKey)
  if (locked) return { blocked: true, attempts: 5 }
  
  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) await redis.expire(attemptsKey, 300)
  
  // Lock after 5 attempts for 30 minutes
  if (attempts >= 5) {
    await redis.set(lockKey, '1', { ex: 1800 })
    return { blocked: true, attempts }
  }
  
  return { blocked: false, attempts }
}
```

---

### 3. Input Sanitisation

```typescript
// lib/security/sanitise.ts
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// Strip all HTML from text fields
export function sanitiseText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .trim()
    .slice(0, 1000) // hard max length
}

// Sanitise entire request body recursively
export function sanitiseInput(obj: unknown): unknown {
  if (typeof obj === 'string') return sanitiseText(obj)
  if (Array.isArray(obj)) return obj.map(sanitiseInput)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .map(([k, v]) => [sanitiseText(k), sanitiseInput(v)])
    )
  }
  return obj
}

// Zod schemas for all inputs
export const guestRegistrationSchema = z.object({
  tripSlug: z.string().regex(/^[A-Za-z0-9_-]{16,24}$/),
  tripCode: z.string().regex(/^[A-Z0-9]{4}$/),
  fullName: z.string().min(2).max(100),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactPhone: z.string().min(7).max(20)
    .regex(/^[+\d\s()-]+$/),
  dietaryRequirements: z.string().max(500).optional(),
  languagePreference: z.enum(['en','es','pt','fr','de','it','ru']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  waiverSignatureText: z.string().min(2).max(100),
  waiverAgreed: z.literal(true),
})

export const addonOrderSchema = z.object({
  guestId: z.string().uuid(),
  tripId: z.string().uuid(),
  orders: z.array(z.object({
    addonId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
  })).max(20),
})
```

---

### 4. SSRF Protection (URL Scraper)

```typescript
// lib/security/ssrf.ts
import { URL } from 'url'

const ALLOWED_DOMAINS = [
  'boatsetter.com',
  'www.boatsetter.com',
  'getmyboat.com',
  'www.getmyboat.com',
]

const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./, // link-local
  /^::1$/,       // IPv6 localhost
  /^fd/,         // IPv6 private
]

export function validateScrapingURL(urlString: string): {
  valid: boolean
  error?: string
} {
  try {
    const url = new URL(urlString)
    
    // Only HTTPS
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs allowed' }
    }
    
    // Check against allowlist
    if (!ALLOWED_DOMAINS.includes(url.hostname)) {
      return { valid: false, error: 'Domain not allowed' }
    }
    
    // Block internal IP patterns in hostname
    if (BLOCKED_IP_RANGES.some(r => r.test(url.hostname))) {
      return { valid: false, error: 'Internal addresses not allowed' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL' }
  }
}
```

---

### 5. File Upload Security

```typescript
// lib/security/uploads.ts
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateUpload(file: File): {
  valid: boolean
  error?: string
} {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP allowed' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 5MB)' }
  }
  
  // Check magic bytes (not just extension)
  // Handled server-side after reading file buffer
  return { valid: true }
}

// Server-side magic byte validation
export async function validateFileMagicBytes(
  buffer: ArrayBuffer
): Promise<boolean> {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  
  const JPEG = [0xFF, 0xD8, 0xFF]
  const PNG  = [0x89, 0x50, 0x4E, 0x47]
  const WEBP = [0x52, 0x49, 0x46, 0x46] // RIFF
  
  if (bytes[0] === JPEG[0] && bytes[1] === JPEG[1] && bytes[2] === JPEG[2]) return true
  if (bytes[0] === PNG[0] && bytes[1] === PNG[1] && bytes[2] === PNG[2] && bytes[3] === PNG[3]) return true
  if (bytes[0] === WEBP[0] && bytes[1] === WEBP[1] && bytes[2] === WEBP[2] && bytes[3] === WEBP[3]) return true
  
  return false
}
```

---

### 6. Stripe Webhook Validation

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text() // raw body for signature
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    // Invalid signature — reject silently to attacker
    console.error('[webhook] invalid signature:', err)
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }
  
  // Handle event...
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
      break
  }
  
  return NextResponse.json({ received: true })
}
```

---

### 7. Server-Side Price Validation

```typescript
// NEVER trust client-provided prices
// app/api/addons/order/route.ts
export async function POST(req: NextRequest) {
  const body = addonOrderSchema.parse(await req.json())
  
  // Fetch prices from database — never from request
  const { data: addons } = await supabase
    .from('addons')
    .select('id, price_cents, max_quantity, is_available')
    .in('id', body.orders.map(o => o.addonId))
    .eq('is_available', true)
  
  if (!addons) throw new Error('Addons not found')
  
  const addonMap = new Map(addons.map(a => [a.id, a]))
  
  // Calculate price server-side
  const orderItems = body.orders.map(order => {
    const addon = addonMap.get(order.addonId)
    if (!addon) throw new Error(`Addon ${order.addonId} not found`)
    if (order.quantity > addon.max_quantity) throw new Error('Quantity exceeded')
    
    return {
      addonId: order.addonId,
      quantity: order.quantity,
      unitPriceCents: addon.price_cents, // FROM DATABASE
      totalCents: addon.price_cents * order.quantity, // CALCULATED HERE
    }
  })
  
  // Insert with verified prices
  await supabase.from('guest_addon_orders').insert(
    orderItems.map(item => ({
      guest_id: body.guestId,
      trip_id: body.tripId,
      addon_id: item.addonId,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents, // verified
      total_cents: item.totalCents,          // calculated server-side
    }))
  )
}
```

---

### 8. Security Headers (Next.js middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  )
  response.headers.set('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Next.js requires this
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.open-meteo.com",
    "frame-ancestors 'none'",
  ].join('; '))
  
  return response
}
```

---

### 9. Auth Middleware for Dashboard

```typescript
// lib/security/auth.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireOperator() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  // Verify operator record exists and is active
  const { data: operator } = await supabase
    .from('operators')
    .select('id, subscription_status, is_active')
    .eq('id', user.id)
    .single()
  
  if (!operator || !operator.is_active) {
    redirect('/login?error=account_inactive')
  }
  
  return { user, operator }
}
```

---

### 10. Environment Variable Security

```bash
# .gitignore — MUST include
.env
.env.local
.env.production
.env.*.local

# Never in code — always in environment
# Vercel: Settings → Environment Variables
# Render: Environment → Environment Variables
```

```typescript
// lib/config/env.ts
// Validate all required env vars at startup
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'QR_HMAC_SECRET',
  'TRIP_LINK_SECRET',
  'RESEND_API_KEY',
]

required.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`)
  }
})
```

---

## Security Checklist Before Every PR

```
□ All user inputs validated with Zod schema
□ All text fields sanitised with DOMPurify
□ Rate limiting applied to endpoint
□ Auth check applied (if operator route)
□ Database queries use parameterised values
□ No console.log with sensitive data
□ No error messages exposing internals
□ File uploads validate magic bytes
□ External URLs validated against allowlist
□ Prices calculated server-side only
□ QR tokens cryptographically signed
□ Stripe webhooks signature verified
□ RLS policies cover new tables
□ No secrets in client-side code
□ .env not committed
```

---

## Dependencies for Security

```json
{
  "isomorphic-dompurify": "^2.4.0",
  "zod": "^3.22.0",
  "@upstash/redis": "^1.28.0",
  "crypto": "built-in Node.js",
  "stripe": "^14.0.0"
}
```

## Packages to NEVER use

```
eval() — never
Function() constructor — never
innerHTML without sanitisation — never
dangerouslySetInnerHTML — never (unless sanitised)
exec() with user input — never
```
