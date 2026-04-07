# DockPass — Master Implementation Blueprint
# @MASTER — READ THIS FIRST, ALWAYS

## Status: PRIMARY REFERENCE DOCUMENT
## Version: Final (from CTO Blueprint + Full Agent System)
## Last updated: April 2026

---

## What This Document Is

This is the single source of truth for DockPass.
It combines the business architecture matrix with
the full technical agent system. Every decision
made in this project traces back to this document.

Before building anything:
1. Read this document top to bottom once
2. Reference the relevant agent files below
3. Follow HOWTO.md for step-by-step execution

---

## The Product (Non-Negotiable Definition)

DockPass (dockpass.io) is a PWA that owns the
unaddressed gap between charter booking confirmation
and guest boarding.

One shareable trip link per booking.
Operator sends once. Every guest self-registers.
No app download. No login for guests.
Works globally. Works in any language.

Owned by: Oakmont Logic LLC (Wyoming, USA)

---

## Implementation Sequence
## (Follow this exact order — no skipping)

```
SEQ  FEATURE                PROVIDER/TECH          PURPOSE
─────────────────────────────────────────────────────────────
1    Legal Identity         Northwest Registered    Mercury Bank KYC
                            Agents — Virtual        requires strict
                            Office, St. Petersburg  physical address
                            FL (Suite #8722)        proof

2    Tax ID & Compliance    IRS (SS-4 form) +       Unlocks Wise
                            FinCEN (BOI report)     Business / Mercury
                            via Notifyre (E-fax)    Bank. Prevents
                                                    FinCEN penalties.

3    Telecom & SMS          OpenPhone               Miami 786 area
                            (786 area code)         code builds trust
                            linked to               with Florida
                            admin@dockpass.io       captains. SMS
                                                    for DockPass links.

4    Frontend + Edge        Next.js 15+             App Router, Server
                            React 19                Components, Server
                            Hosted on Vercel        Actions for mutations.

5    UI & Styling           Tailwind CSS v4 +       Navy/Teal brand.
                            shadcn/ui               Responsive SaaS
                                                    across all devices.

6    Database & Auth        Supabase                RLS enforced.
                            PostgreSQL 15+          Supabase Auth JWTs.
                                                    No raw SQL on client.

7    Caching + Protection   Upstash Redis           Edge rate limiting.
                            (Serverless)            Session caching.
                                                    DDoS protection.

8    Interactive Mapping    Mapbox GL JS v3+        Client-side map
                                                    rendering with
                                                    cached GeoJSON
                                                    from Redis/Supabase.

9    Backend Workers        Node.js via Render      BullMQ + Redis
                            BullMQ                  Pub/Sub. Async
                                                    tasks without
                                                    blocking UI.

10   Payments Engine        Stripe Connect          Webhook-driven.
                            (Latest API)            Splits payments:
                                                    booking fee to
                                                    DockPass + payout
                                                    to operator.

11   Baseline Revenue       BoatUS Affiliate        $30 per captain
                            Program                 referred for
                                                    towing/membership.
                                                    Zero-friction revenue.

12   Transactional          Buoy API (REST)         Webhook triggers
     Insurance                                      policy on trip
                                                    start. Florida
                                                    Livery Law compliant.

13   Embedded Protection    Tint.ai API             "DockPass Guarantees"
                                                    premium subscription
                                                    for captains.
                                                    High-margin recurring.
```

---

## Final Technology Stack

### Frontend (Vercel)
```
Framework:    Next.js 15+ (App Router)
Language:     TypeScript (strict mode)
Runtime:      React 19
Styling:      Tailwind CSS v4
Components:   shadcn/ui
PWA:          next-pwa
Animations:   Framer Motion (transitions only)
Maps:         Mapbox GL JS v3+
i18n:         i18next + react-i18next
QR:           qrcode.react
Postcard:     html2canvas
Icons:        Lucide React
```

### Backend (Vercel + Render)
```
API:          Next.js 15 API Routes (serverless)
              Server Actions for mutations
Workers:      Node.js on Render
Queues:       BullMQ + Redis (Render)
Cron:         Render Cron
```

### Data
```
Primary DB:   Supabase (PostgreSQL 15+)
Auth:         Supabase Auth (JWT)
Storage:      Supabase Storage
Cache:        Upstash Redis (serverless/edge)
Worker Redis: Render Redis (BullMQ)
```

### Services
```
Payments:     Stripe Connect (split payments)
Telecom:      OpenPhone (786 Miami area code)
SMS fallback: Twilio (automated messages only)
Email:        Resend
Mapping:      Mapbox GL JS v3+
Weather:      Open-Meteo (free, no key)
PDF:          pdf-lib
Scraping:     Apify
```

### Revenue APIs
```
Insurance:    Buoy API (per-trip, REST)
Protection:   Tint.ai (DockPass Guarantees)
Affiliates:   BoatUS ($30/captain referral)
              Novamar (charter insurance)
              Boat-Ed (Florida boating course)
```

### Business Infrastructure
```
Legal:        Oakmont Logic LLC (Wyoming)
Address:      Northwest Agents, St. Petersburg FL
Banking:      Mercury Bank (US business account)
Payments:     Stripe Connect (US account)
Phone:        OpenPhone — 786 area code
Email:        admin@dockpass.io
Domain:       dockpass.io (Cloudflare DNS)
IDE:          Cursor or Windsurf (Antigravity)
```

---

## Agent File System

### How to use in Cursor/Windsurf/Antigravity IDE

Place all files in: docs/agents/
Reference with @ command in terminal.

```
PRIORITY ORDER — read in this sequence:

@MASTER            ← You are here. Always first.
@PRODUCT           ← Product definition + user flows
@ARCHITECTURE      ← System design (updated stack)
@DATABASE          ← Supabase schema + RLS
@SECURITY          ← All security implementations
@FRONTEND          ← React 19 + Next.js 15 + shadcn
@DESIGN            ← Design system
@BACKEND           ← API routes + workers
@PAYMENTS          ← Stripe Connect
@NOTIFICATIONS     ← OpenPhone + email + push
@COMPLIANCE        ← GDPR + Buoy API + FL law
@REDIS             ← Caching + BullMQ
@TESTING           ← Tests + coverage
@DEPLOYMENT        ← CI/CD + launch checklist
@HOWTO             ← Step-by-step build guide
@AUTOMATION        ← Self-serve support system
```

### Numbered agent naming (for IDE reference)

```
docs/agents/00-MASTER.md          ← this file
docs/agents/01-PRODUCT.md
docs/agents/02-ARCHITECTURE.md
docs/agents/03-DATABASE.md
docs/agents/04-SECURITY.md
docs/agents/05-FRONTEND.md
docs/agents/06-DESIGN.md
docs/agents/07-BACKEND.md
docs/agents/08-PAYMENTS.md
docs/agents/09-NOTIFICATIONS.md
docs/agents/10-COMPLIANCE.md
docs/agents/11-REDIS.md
docs/agents/12-TESTING.md
docs/agents/13-DEPLOYMENT.md
docs/agents/14-HOWTO.md
docs/agents/15-AUTOMATION.md
```

---

## Key Changes From PDF Blueprint

### 1. Next.js 15 + React 19 (upgrade from 14/18)

```typescript
// Server Components are now default
// Server Actions replace most POST API routes
// Use Server Actions for:
//   - Guest registration
//   - Trip creation
//   - Boat profile setup
//   - Add-on ordering

// Keep API routes for:
//   - Stripe webhooks (needs raw body)
//   - External webhook receivers
//   - QR verification

// Next.js 15 breaking changes to know:
// - cookies(), headers() are now async
// - params in page.tsx are now async
// - fetch caching opt-in (not opt-out)
```

### 2. Tailwind CSS v4 (upgrade from v3)

```typescript
// v4 key changes:
// - Config is now in CSS, not tailwind.config.js
// - @import "tailwindcss" in globals.css
// - Custom tokens with CSS variables
// - No more purge config needed

// globals.css
// @import "tailwindcss";
// @theme {
//   --color-navy: #0C447C;
//   --color-teal: #1D9E75;
//   --color-coral: #E8593C;
//   --font-sans: Inter, sans-serif;
// }
```

### 3. shadcn/ui (new addition)

```typescript
// Use shadcn/ui for:
//   - Form components (Input, Select, Checkbox)
//   - Dialog / Sheet (bottom sheet for join flow)
//   - Toast notifications
//   - Dropdown menus in dashboard
//   - Command palette (operator search)

// Build custom for:
//   - All guest-facing components (DockPass brand)
//   - Weather widget
//   - Boarding pass
//   - Postcard generator
//   - AnchorLoader

// Install: npx shadcn@latest init
// Add components as needed:
//   npx shadcn@latest add button
//   npx shadcn@latest add input
//   npx shadcn@latest add sheet
//   npx shadcn@latest add dialog
//   npx shadcn@latest add toast
```

### 4. Mapbox GL JS v3+ (replaces Leaflet)

```typescript
// Mapbox vs Leaflet decision:
// Mapbox: better visuals, marina detail, 
//         satellite view, better mobile
// Cost: free up to 50,000 loads/month
//       (sufficient for MVP)

// Setup:
// NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

// Use for:
//   - Marina location pin
//   - Route preview with stops
//   - Dock finder map

// Keep Leaflet as fallback only if
// Mapbox token not configured
```

### 5. Stripe Connect (replaces basic Stripe)

```typescript
// Stripe Connect enables:
//   - Split payments (DockPass fee + operator payout)
//   - Operator onboarding as Connected Accounts
//   - Marketplace payment model

// Two account types:
//   Standard: operator manages their own Stripe
//   Express: DockPass manages, simpler onboarding

// Use Express for MVP:
//   Faster operator onboarding
//   DockPass controls the experience
//   Payouts handled automatically

// Revenue model:
//   Guest pays $950 charter
//   Stripe takes ~2.9% + 30¢
//   DockPass takes platform fee (future)
//   Operator receives remainder
```

### 6. OpenPhone (new — replaces Twilio for operator comms)

```typescript
// OpenPhone: 786 (Miami) area code VoIP
// Linked to admin@dockpass.io
// Used for:
//   - Inbound operator calls
//   - SMS to operators (not guests)
//   - Warm, local Florida number
//   - Builds trust with Miami captains

// Twilio still used for:
//   - Automated guest SMS (reminders)
//   - System notifications
//   - BullMQ queue messages

// OpenPhone is human-operated
// Twilio is automated/programmatic
```

### 7. Buoy API — Transactional Insurance

```typescript
// Buoy API: per-trip on-demand insurance
// Florida Livery Law requirement for
// commercial charter operators

// Integration point:
//   Trip status changes to 'active'
//   → Webhook fires to Buoy API
//   → Policy activates for that trip
//   → Covers captain + passengers
//   → Policy ends when trip completes

// This is OPERATOR insurance (not guest)
// Guest insurance = Novamar affiliate

// Revenue model:
//   Buoy pays DockPass referral commission
//   OR DockPass earns on policy spread

// Setup: Apply at buoy.insure for API access
// Register Oakmont Logic LLC
```

### 8. Tint.ai — DockPass Guarantees

```typescript
// Tint.ai: embedded insurance platform
// Powers "DockPass Guarantees" product
// Premium subscription for operators

// What it covers:
//   Captain sells "DockPass Guarantee" to guests
//   Guest pays extra (e.g. $15) for guarantee
//   If trip cancelled: automatic refund
//   If experience unsatisfactory: credit

// Revenue model:
//   Tint.ai handles underwriting
//   DockPass earns margin on each policy
//   Positioned as high-margin recurring revenue

// Implementation:
//   Tint.ai REST API
//   Backend on Render evaluates risk
//   Frontend presents via Next.js checkout
//   Only for operators with active subscription

// Setup: Apply at tint.ai for API partnership
```

### 9. BoatUS Affiliate

```typescript
// BoatUS: largest US recreational marine 
// association. Towing + membership services.

// Commission: $30 per captain referred
// Who sees it: operators during boat setup
// Placement: "Protect your investment" card
//             in operator dashboard

// Simple affiliate link with UTM tracking:
// BOATUS_AFFILIATE_URL=https://boatus.com/?ref=dockpass
// No API integration needed — just smart linking
```

---

## Business Prerequisites Checklist

```
Legal + Banking (do in this order):
□ 1. Northwest Agents virtual office
     St. Petersburg FL Suite #8722
     Cost: ~$29/month
     Purpose: physical address for Mercury KYC

□ 2. IRS SS-4 form (get EIN)
     Submit via Notifyre E-fax to IRS
     Or online at irs.gov
     Takes 1-4 weeks by fax / instant online

□ 3. FinCEN BOI report
     Beneficial Ownership Information
     Required for all LLCs formed after Jan 1 2024
     Submit at fincen.gov/boi
     Deadline: 90 days of formation

□ 4. Mercury Bank account
     mercuryhq.com
     Requires: EIN + Wyoming articles + address
     Opens remotely — no US visit needed

□ 5. OpenPhone number
     openphone.com
     Get 786 (Miami/Dade) area code
     Link to admin@dockpass.io
     Cost: $13/month

□ 6. Stripe Connect account
     Use Oakmont Logic LLC + EIN + Mercury
     Enable Standard or Express Connect
     Get publishable + secret keys

□ 7. Mapbox account
     mapbox.com — free tier (50k loads/mo)
     Get public token
     Add to NEXT_PUBLIC_MAPBOX_TOKEN

□ 8. Apply: Buoy API
     buoy.insure — request API access
     For Florida Livery Law compliance feature

□ 9. Apply: Tint.ai partnership
     tint.ai — request embedded insurance access
     For DockPass Guarantees product

□ 10. Apply: BoatUS Affiliate
      boatus.com/affiliates
      Simple URL tracking, no approval wait
```

---

## Revenue Model (Final Version)

```
SUBSCRIPTIONS (primary):
  Solo    1 boat    $49/mo
  Captain 2-3 boats $89/mo
  Fleet   4-10      $179/mo
  Marina  Unlimited $349/mo
  Annual: 20% discount

INSURANCE AFFILIATES:
  Novamar charter insurance  15-25% commission
  Buoy API per-trip          per-policy spread
  Tint.ai DockPass Guarantee high-margin recurring
  Guest trip protection      $2-3 per policy

MARINE AFFILIATES:
  BoatUS membership          $30 per referral
  Florida boating course     $8-15 per completion

ADD-ON COMMISSIONS:
  8% of all add-on orders
  Champagne, photographer, snorkel kits, etc.

MARINA PARTNERSHIPS:
  $349/mo covers all marina operators
  White-label available: $699-1,200/mo

TARGET:
  Month 5:  $4,000/month
  Month 8:  $7,000/month
  Month 18: $25,000/month
```

---

## The Three Users (Final)

```
OPERATOR (pays $49-$349/mo):
  Creates boat profile once
  Creates trips in 30 seconds
  Monitors dashboard
  Downloads manifest PDF

GUEST (always free):
  Opens shared link
  Enters 4-char trip code
  Self-registers + signs waiver
  Orders add-ons
  Gets QR boarding pass
  Downloads trip postcard

CAPTAIN (no account ever):
  Receives read-only snapshot
  No login, no app
  Manual boarding fallback
  Snapshot expires in 1 hour
```

---

## Non-Negotiable Build Standards

```
Every agent file enforces these:

Code:
✓ TypeScript strict — no 'any'
✓ Server Components by default (Next.js 15)
✓ Server Actions for mutations
✓ Zod validation on all inputs
✓ DOMPurify sanitisation on all text

Security:
✓ Supabase RLS on every table
✓ Rate limiting on all public endpoints
✓ HMAC-signed QR tokens
✓ SSRF protection on scraper
✓ Stripe webhook signature verified
✓ Prices calculated server-side only
✓ No secrets in code or git

Design:
✓ Navy #0C447C primary
✓ Flat — no gradients ever
✓ Inter font
✓ ⚓ anchor as loading symbol
✓ shadcn/ui for form components
✓ Custom components for brand elements
✓ Mobile-first 390px

Business:
✓ Annual billing offered from day one
✓ 14-day free trial for all operators
✓ Instant refund policy (no argument)
✓ BoatUS affiliate in operator dashboard
✓ Buoy API fires on every trip start
✓ GDPR auto-cleanup after 90 days
```

---

## How Agentic IDE Builds This

```
Building Sequence 4 & 5 (Frontend)?
→ @MASTER @FRONTEND @DESIGN

Building Sequence 6 (Database)?
→ @MASTER @DATABASE @SECURITY

Building Sequence 9 (Workers)?
→ @MASTER @BACKEND @REDIS

Building Sequence 10 (Payments)?
→ @MASTER @PAYMENTS @SECURITY

Building Sequence 12 (Buoy Insurance)?
→ @MASTER @COMPLIANCE @BACKEND

Building Sequence 13 (Tint.ai)?
→ @MASTER @PAYMENTS @COMPLIANCE

Building any feature?
Always start: @MASTER + relevant agents
```

---

## Quick Reference — Changed Files

```
File          What Changed
──────────────────────────────────────────────
ARCHITECTURE  Next.js 15, React 19, Tailwind v4,
              shadcn/ui, Mapbox, Stripe Connect,
              OpenPhone added

FRONTEND      Next.js 15 Server Components,
              Server Actions, React 19,
              Tailwind v4 config, shadcn/ui setup

PAYMENTS      Stripe Connect (Express accounts),
              payment splitting architecture,
              Tint.ai DockPass Guarantees,
              BoatUS affiliate

NOTIFICATIONS OpenPhone for operator calls,
              OpenPhone SMS for Florida captains,
              Twilio kept for automated only

COMPLIANCE    Buoy API integration,
              Florida Livery Law requirement,
              Tint.ai legal considerations

HOWTO         Steps updated for new stack:
              shadcn/ui init step added,
              Mapbox token step added,
              OpenPhone setup step added,
              Buoy API step added
```
