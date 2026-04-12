# BoatCheckin — Architecture Agent
# @ARCHITECTURE

## Role
You are the system architect for BoatCheckin.
Your job is to ensure every technical decision
aligns with the product requirements, security
standards, and scalability goals defined in
@PRODUCT.md and @SECURITY.md.

---

## Technology Stack (Final, Non-Negotiable)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript (strict mode)
- **PWA:** next-pwa
- **Hosting:** Vercel

### Backend
- **API:** Next.js API Routes (serverless)
- **Long-running jobs:** Render (Node.js service)
- **Queue:** Redis (BullMQ on Render)
- **Cron jobs:** Render Cron

### Database
- **Primary:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage
- **Cache:** Redis (Upstash for serverless)

### External Services
- **Payments:** Stripe (subscriptions + add-ons)
- **Email:** Resend
- **SMS:** Twilio
- **Weather:** Open-Meteo (free, no key)
- **Maps:** Leaflet.js (free, no API key)
- **QR:** qrcode.react
- **PDF:** pdf-lib
- **i18n:** i18next + react-i18next
- **Scraping:** Apify (Boatsetter/GetMyBoat import)

---

## Directory Structure

```
dockpass/
├── apps/
│   ├── web/                    # Next.js app (Vercel)
│   │   ├── app/
│   │   │   ├── (public)/       # Guest-facing pages
│   │   │   │   ├── trip/[slug]/
│   │   │   │   └── snapshot/[token]/
│   │   │   ├── (auth)/         # Operator auth pages
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── dashboard/      # Operator dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   ├── trips/
│   │   │   │   ├── boats/
│   │   │   │   ├── guests/
│   │   │   │   ├── revenue/
│   │   │   │   └── reviews/
│   │   │   ├── api/            # API routes
│   │   │   │   ├── trips/
│   │   │   │   ├── guests/
│   │   │   │   ├── waivers/
│   │   │   │   ├── addons/
│   │   │   │   ├── weather/
│   │   │   │   ├── scrape/
│   │   │   │   ├── webhooks/
│   │   │   │   └── qr/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Base components
│   │   │   ├── trip/           # Trip page sections
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── join/           # Join flow steps
│   │   │   └── shared/         # Shared components
│   │   ├── lib/
│   │   │   ├── supabase/       # DB client + queries
│   │   │   ├── stripe/         # Payment helpers
│   │   │   ├── redis/          # Cache helpers
│   │   │   ├── security/       # Security utilities
│   │   │   ├── pdf/            # PDF generation
│   │   │   ├── qr/             # QR generation
│   │   │   ├── weather/        # Weather API
│   │   │   └── i18n/           # Translations
│   │   ├── types/              # TypeScript types
│   │   ├── hooks/              # React hooks
│   │   ├── middleware.ts        # Auth + security
│   │   └── public/
│   │       ├── manifest.json   # PWA manifest
│   │       └── icons/
│   └── worker/                 # Render background service
│       ├── queues/
│       │   ├── notifications.ts
│       │   ├── weather-monitor.ts
│       │   ├── review-requests.ts
│       │   └── rebooking.ts
│       └── cron/
│           ├── weather-check.ts
│           └── manifest-cleanup.ts
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
├── supabase/
│   ├── migrations/             # DB migrations
│   ├── seed.sql                # Seed data
│   └── config.toml
└── docs/agents/                # Agent .md files
```

---

## Data Flow Architecture

```
Guest opens trip link
        ↓
Vercel Edge (CDN cache for static content)
        ↓
Next.js API Route validates trip slug
        ↓
Supabase: fetch trip + boat + operator data
        ↓
Redis: check rate limits for this trip
        ↓
Render trip page with SSR data
        ↓
Guest submits registration
        ↓
API Route: validate code → sanitise input
→ Supabase: insert guest record
→ Redis: increment trip registration count
→ Generate QR (signed HMAC)
→ Generate confirmation
        ↓
Render worker: send notification to operator
```

---

## Caching Strategy

```
Redis keys structure:

rate:trip:{slug}:code:{code}    TTL: 1800s (30min lockout)
rate:trip:{slug}:attempts       TTL: 300s (5 min window)
cache:weather:{lat}:{lng}:{date} TTL: 10800s (3 hours)
cache:trip:{slug}               TTL: 300s (5 min)
session:operator:{id}           TTL: 86400s (24 hours)
lock:scrape:{operatorId}        TTL: 30s (prevent duplicates)
```

---

## Environment Variables (Required)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis (Upstash for Vercel, BullMQ for Render)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
REDIS_URL= (Render worker)

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (email)
RESEND_API_KEY=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# QR signing
QR_HMAC_SECRET= (32 byte random string)

# Trip link security
TRIP_LINK_SECRET= (32 byte random string)

# Apify (scraper)
APIFY_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://boatcheckin.com
NODE_ENV=production
```

---

## API Route Standards

Every API route MUST follow this pattern:

```typescript
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/security/validate'
import { rateLimit } from '@/lib/security/rate-limit'
import { sanitiseInput } from '@/lib/security/sanitise'

export async function POST(req: NextRequest) {
  // 1. Rate limit check FIRST
  const limited = await rateLimit(req, { max: 10, window: 60 })
  if (limited) return NextResponse.json(
    { error: 'Too many requests' }, { status: 429 }
  )

  // 2. Auth check (if required)
  const operator = await validateRequest(req)
  if (!operator) return NextResponse.json(
    { error: 'Unauthorized' }, { status: 401 }
  )

  // 3. Parse + sanitise body
  const raw = await req.json()
  const body = sanitiseInput(raw)

  // 4. Validate schema (Zod)
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json(
    { error: result.error }, { status: 400 }
  )

  // 5. Business logic
  try {
    const data = await doSomething(result.data)
    return NextResponse.json({ data })
  } catch (error) {
    // 6. Never expose internal errors
    console.error('[route] error:', error)
    return NextResponse.json(
      { error: 'Internal error' }, { status: 500 }
    )
  }
}
```

---

## Deployment Architecture

```
GitHub
  ↓ push to main
  ├── Vercel (auto-deploy web app)
  └── Render (auto-deploy worker)
        ↓
  Both pull env vars from
  their respective dashboards
  (never from code)
```

---

## Performance Targets

- Trip page initial load: < 1.5s
- Guest registration: < 500ms
- QR generation: < 200ms
- PDF manifest: < 2s
- Postcard generation: < 3s
- Dashboard load: < 1s

---

## Monitoring

- Vercel Analytics (built-in, free)
- Supabase Dashboard (DB metrics)
- Upstash Dashboard (Redis metrics)
- Render Metrics (worker health)
- Stripe Dashboard (payment health)
- Resend Dashboard (email delivery)

No external monitoring service needed at MVP.
Add Sentry in phase 2.
