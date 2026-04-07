# DockPass — Backend Agent
# @BACKEND

## Role
You own all API routes, server-side logic,
background workers, and cron jobs for DockPass.
Every route must follow @SECURITY.md standards.
Every database operation follows @DATABASE.md.

---

## API Routes Map

```
POST /api/auth/signup           Operator registration
POST /api/auth/login            Operator login
POST /api/auth/logout           Operator logout

GET  /api/trips/[slug]          Get trip data (public)
POST /api/trips/[slug]/validate-code  Validate trip code
POST /api/trips/[slug]/register       Guest self-register
POST /api/trips/[slug]/addons         Place addon orders
GET  /api/trips/[slug]/qr/[token]     Verify QR token

GET  /api/dashboard/trips       Operator trip list
POST /api/dashboard/trips       Create new trip
GET  /api/dashboard/trips/[id]  Trip detail + guests
PUT  /api/dashboard/trips/[id]  Update trip

GET  /api/dashboard/boats       Operator boats
POST /api/dashboard/boats       Create boat
PUT  /api/dashboard/boats/[id]  Update boat
POST /api/dashboard/boats/import Scrape + import boat

GET  /api/dashboard/guests/[tripId]  Guest list
PUT  /api/dashboard/guests/[id]/approve  Approve guest

GET  /api/dashboard/manifest/[tripId]  Generate PDF manifest
GET  /api/dashboard/postcard/[guestId] Generate postcard

GET  /api/weather/[lat]/[lng]/[date]   Weather forecast

POST /api/webhooks/stripe       Stripe events

GET  /api/captain/[token]       Captain snapshot (read-only)
```

---

## Core API Implementations

### Guest Registration (most complex route)

```typescript
// app/api/trips/[slug]/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitTripCode } from '@/lib/security/rate-limit'
import { guestRegistrationSchema } from '@/lib/security/sanitise'
import { generateQRToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'
import { sendOperatorNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // 1. IP rate limit — max 10 registrations per IP per hour
  if (await rateLimit(req, { max: 10, window: 3600 })) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json(
    { error: 'Invalid request' }, { status: 400 }
  )

  // 2. Validate schema
  const parsed = guestRegistrationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(
    { error: 'Invalid data', details: parsed.error.flatten() },
    { status: 400 }
  )

  const data = parsed.data
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // 3. Verify trip code with rate limiting
  const codeCheck = await rateLimitTripCode(params.slug, ip)
  if (codeCheck.blocked) return NextResponse.json(
    { error: 'Too many incorrect attempts. Try again in 30 minutes.' },
    { status: 429 }
  )

  const supabase = createServiceClient()

  // 4. Get trip (verify slug and code together)
  const { data: trip } = await supabase
    .from('trips')
    .select('id, trip_code, max_guests, status, operator_id, boat_id')
    .eq('slug', params.slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) return NextResponse.json(
    { error: 'Trip not found' }, { status: 404 }
  )

  // 5. Verify trip code (case-insensitive)
  if (data.tripCode.toUpperCase() !== trip.trip_code.toUpperCase()) {
    return NextResponse.json(
      { error: 'Incorrect trip code' }, { status: 400 }
    )
  }

  // 6. Check capacity
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)

  if ((count ?? 0) >= trip.max_guests) return NextResponse.json(
    { error: 'This trip is full' }, { status: 409 }
  )

  // 7. Generate QR token (HMAC signed)
  const guestId = crypto.randomUUID()
  const qrToken = generateQRToken(guestId, trip.id)

  // 8. Insert guest record
  const { error: insertError } = await supabase
    .from('guests')
    .insert({
      id: guestId,
      trip_id: trip.id,
      operator_id: trip.operator_id,
      full_name: data.fullName,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_phone: data.emergencyContactPhone,
      dietary_requirements: data.dietaryRequirements ?? null,
      language_preference: data.languagePreference,
      date_of_birth: data.dateOfBirth ?? null,
      waiver_signed: data.waiverAgreed,
      waiver_signed_at: new Date().toISOString(),
      waiver_signature_text: data.waiverSignatureText,
      waiver_ip_address: ip,
      waiver_user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      approval_status: 'auto_approved',
      qr_token: qrToken,
    })

  if (insertError) {
    console.error('[register] insert error:', insertError.code)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  // 9. Notify operator (non-blocking)
  sendOperatorNotification({
    operatorId: trip.operator_id,
    type: 'guest_registered',
    title: 'New guest checked in',
    body: `${data.fullName} has registered for your trip`,
    data: { tripId: trip.id, guestId },
  }).catch(console.error)

  // 10. Return QR token and guest ID
  return NextResponse.json({
    data: {
      guestId,
      qrToken,
      requiresCourseCheck: shouldShowCourseRequirement(
        data.dateOfBirth,
        trip // charter type
      ),
    }
  })
}

function shouldShowCourseRequirement(
  dob: string | undefined,
  trip: { charter_type?: string }
): boolean {
  if (trip.charter_type === 'captained') return false // captain covers it
  if (!dob) return false
  const birthDate = new Date(dob)
  const cutoff = new Date('1988-01-01')
  return birthDate >= cutoff
}
```

---

### Weather Route (cached)

```typescript
// app/api/weather/[lat]/[lng]/[date]/route.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function GET(
  _req: Request,
  { params }: { params: { lat: string; lng: string; date: string } }
) {
  const cacheKey = `weather:${params.lat}:${params.lng}:${params.date}`
  
  // Check cache first (3 hour TTL)
  const cached = await redis.get(cacheKey)
  if (cached) return Response.json({ data: cached, cached: true })
  
  // Fetch from Open-Meteo (free, no key)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', params.lat)
  url.searchParams.set('longitude', params.lng)
  url.searchParams.set('daily', [
    'weathercode',
    'temperature_2m_max',
    'windspeed_10m_max',
    'precipitation_sum',
  ].join(','))
  url.searchParams.set('start_date', params.date)
  url.searchParams.set('end_date', params.date)
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('windspeed_unit', 'mph')
  
  const res = await fetch(url.toString())
  if (!res.ok) return Response.json({ error: 'Weather unavailable' }, { status: 503 })
  
  const raw = await res.json()
  const weather = {
    code: raw.daily.weathercode[0],
    temperature: Math.round(raw.daily.temperature_2m_max[0]),
    windspeed: Math.round(raw.daily.windspeed_10m_max[0]),
    precipitation: raw.daily.precipitation_sum[0],
  }
  
  // Cache for 3 hours
  await redis.set(cacheKey, weather, { ex: 10800 })
  
  return Response.json({ data: weather })
}
```

---

### Boat Import (Scraper)

```typescript
// app/api/dashboard/boats/import/route.ts
import { validateScrapingURL } from '@/lib/security/ssrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireOperator } from '@/lib/security/auth'

export async function POST(req: NextRequest) {
  // Auth required
  const { operator } = await requireOperator()
  
  // Rate limit — max 5 scrapes per hour per operator
  if (await rateLimit(req, {
    max: 5, window: 3600,
    key: `scrape:${operator.id}`
  })) {
    return NextResponse.json(
      { error: 'Import limit reached. Try again in an hour.' },
      { status: 429 }
    )
  }
  
  const { url } = await req.json()
  
  // SSRF protection — allowlist only
  const validation = validateScrapingURL(url)
  if (!validation.valid) return NextResponse.json(
    { error: validation.error }, { status: 400 }
  )
  
  // Call Apify scraper
  const result = await scrapeBoatListing(url)
  
  return NextResponse.json({ data: result })
}

async function scrapeBoatListing(url: string) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/` +
    `apify~web-scraper/runs?token=${process.env.APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url }],
        // Extract specific fields only
      }),
    }
  )
  // Process and return structured boat data
}
```

---

## Render Worker (Background Jobs)

```typescript
// apps/worker/index.ts
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

// Queue definitions
export const notificationQueue = new Queue('notifications', { connection: redis })
export const weatherQueue = new Queue('weather-monitor', { connection: redis })
export const reviewQueue = new Queue('review-requests', { connection: redis })
export const rebookingQueue = new Queue('rebooking', { connection: redis })

// Notification worker
new Worker('notifications', async (job) => {
  switch (job.data.type) {
    case 'guest_registered':
      await sendPushNotification(job.data)
      break
    case 'weather_alert':
      await sendWeatherAlert(job.data)
      break
    case 'review_request':
      await sendReviewRequest(job.data)
      break
  }
}, { connection: redis, concurrency: 5 })
```

---

## Cron Jobs (Render Cron)

```yaml
# render.yaml (cron service config)
services:
  - type: cron
    name: dockpass-cron
    schedule: "0 * * * *"    # every hour
    buildCommand: npm install
    startCommand: node dist/cron/hourly.js
    
  - type: cron
    name: dockpass-daily
    schedule: "0 6 * * *"    # 6am UTC daily
    startCommand: node dist/cron/daily.js
```

```typescript
// apps/worker/cron/hourly.ts
// Runs every hour
async function hourly() {
  await checkUpcomingWeather()   // Check weather for next 24hr trips
  await processReviewRequests()  // Send post-trip review requests
}

// apps/worker/cron/daily.ts
// Runs at 6am UTC daily
async function daily() {
  await activateTripsForToday()  // upcoming → active
  await completeYesterdaysTrips() // active → completed
  await sendRebookingSequences() // 60-day follow-ups
  await gdprCleanup()            // anonymise old guest data
}
```

---

## Error Handling Standards

```typescript
// NEVER expose internal errors to clients
// ALWAYS log internally

// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public publicMessage: string
  ) {
    super(message)
  }
}

// In API routes:
try {
  // ... logic
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.publicMessage },
      { status: error.statusCode }
    )
  }
  // Unknown errors — never expose details
  console.error('[route] unexpected error:', error)
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  )
}
```

---

## PDF Manifest Generation

```typescript
// lib/pdf/manifest.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateManifest(
  trip: TripData,
  guests: GuestData[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  
  const navy = rgb(0.047, 0.267, 0.486) // #0C447C
  
  // Header
  page.drawText('PASSENGER MANIFEST', {
    x: 50, y: 800,
    size: 16, font: boldFont, color: navy,
  })
  
  // Trip details
  page.drawText(`${trip.boatName} · ${trip.tripDate} · ${trip.departureTime}`, {
    x: 50, y: 780,
    size: 11, font,
  })
  
  // Guest table
  let y = 740
  guests.forEach((guest, i) => {
    page.drawText(`${i + 1}. ${guest.fullName}`, {
      x: 50, y,
      size: 10, font,
    })
    page.drawText(`EC: ${guest.emergencyContactName} ${guest.emergencyContactPhone}`, {
      x: 200, y,
      size: 9, font: font, color: rgb(0.42, 0.49, 0.58),
    })
    page.drawText(guest.waiverSigned ? '✓ Signed' : '✗ Pending', {
      x: 480, y,
      size: 9, font,
      color: guest.waiverSigned ? rgb(0.11, 0.62, 0.46) : rgb(0.84, 0.23, 0.21),
    })
    y -= 22
  })
  
  // Footer
  page.drawText(`Generated by DockPass · dockpass.io · ${new Date().toISOString()}`, {
    x: 50, y: 40,
    size: 8, font, color: rgb(0.42, 0.49, 0.58),
  })
  
  return doc.save()
}
```
