# BoatCheckin — Agent Index
# @AGENTS (read this first)

## What is this?

This is the agentic development system for BoatCheckin.
Each .md file is a specialised agent with deep expertise
in one area. Use @ commands in Antigravity IDE terminal
to include the relevant agent in your context window
before writing any code.

---

## Agent Team

```
@PRODUCT       Master product context — read before anything
@ARCHITECTURE  System design, stack decisions, directory structure
@DATABASE      Supabase schema, RLS policies, queries, migrations
@SECURITY      All vulnerability mitigations, security utilities
@FRONTEND      React components, PWA, i18n, animations
@DESIGN        Colour system, typography, components reference
@BACKEND       API routes, workers, cron jobs, PDF generation
@PAYMENTS      Stripe subscriptions, webhooks, commissions
@NOTIFICATIONS Email, SMS, push, in-app notifications
@COMPLIANCE    GDPR, maritime law, waiver legality, privacy
@REDIS         Caching, rate limiting, BullMQ queues
@TESTING       Unit tests, E2E tests, coverage standards
@DEPLOYMENT    CI/CD, Vercel, Render, Cloudflare, launch checklist
```

---

## How to Use in Antigravity IDE

### Starting a new feature
```
@PRODUCT @ARCHITECTURE
Build the trip creation flow for operators.
Create trips in 30 seconds by selecting boat,
date, time, and duration.
```

### Building a secure API route
```
@SECURITY @BACKEND @DATABASE
Build the guest registration API route at
/api/trips/[slug]/register
Follow all security patterns exactly.
```

### Building a UI component
```
@DESIGN @FRONTEND
Build the WeatherWidget component.
Use exact colours from the design system.
Include anchor loader for loading state.
```

### Database changes
```
@DATABASE @SECURITY
Add a push_subscriptions table to store
PWA push notification subscriptions.
Include RLS policies.
```

### Payment feature
```
@PAYMENTS @SECURITY @BACKEND
Build the subscription upgrade flow.
Operator taps upgrade, Stripe Checkout opens,
webhook updates their tier in Supabase.
```

### Full feature (use all relevant agents)
```
@PRODUCT @DESIGN @FRONTEND @BACKEND @DATABASE @SECURITY
Build the complete postcard generator feature.
Post-trip screen shows 3 style options.
Guest taps download → 1080x1080 PNG generated.
```

---

## Build Order (Week by Week)

### Week 1 — Foundation
```
Day 1: @DEPLOYMENT @DATABASE
  → Set up Supabase project
  → Run all migrations
  → Configure Vercel + Render
  → Set all environment variables

Day 2: @ARCHITECTURE @BACKEND
  → Scaffold Next.js project structure
  → Set up Supabase clients (browser + server)
  → Set up Redis (Upstash)
  → Auth middleware

Day 3-4: @FRONTEND @DESIGN
  → Design system in Tailwind (globals.css)
  → AnchorLoader component
  → Info card, button, badge components
  → i18n setup with EN + ES translations

Day 5: @BACKEND @DATABASE @SECURITY
  → Boat profile setup API
  → URL scraper import endpoint (with SSRF protection)
  → Operator onboarding wizard UI
```

### Week 2 — Guest Flow
```
Day 1-2: @FRONTEND @DESIGN @BACKEND
  → Trip page (all sections)
  → Weather widget (Open-Meteo integration)
  → Static sections: dock, captain, checklist, rules

Day 3: @BACKEND @DATABASE @SECURITY
  → Trip creation API
  → Trip code generation
  → Non-guessable slug generation

Day 4-5: @FRONTEND @BACKEND @SECURITY
  → Join flow bottom sheet
  → Step 1: Trip code + rate limiting
  → Step 2: Personal details form
  → Step 3: Waiver signing
  → Guest registration API (complete)
```

### Week 3 — Revenue + Dashboard
```
Day 1-2: @FRONTEND @BACKEND @DATABASE
  → QR boarding pass generation
  → Add-on menu + ordering
  → PWA manifest + service worker

Day 3: @PAYMENTS @BACKEND
  → Stripe subscription checkout
  → Webhook handler
  → Upgrade prompt component

Day 4-5: @FRONTEND @BACKEND
  → Operator dashboard (home, trips, guests)
  → Guest list table with waiver status
  → WhatsApp message generator
  → Captain snapshot share
```

### Week 4 — Polish + Revenue Features
```
Day 1-2: @NOTIFICATIONS @BACKEND
  → Post-trip review request emails
  → Weather monitoring cron job
  → Operator push notifications

Day 3: @COMPLIANCE @BACKEND
  → GDPR consent flow
  → Privacy policy + terms pages
  → Data deletion endpoint

Day 4: @BACKEND @FRONTEND
  → Passenger manifest PDF
  → Postcard generator (3 styles)
  → Insurance + course affiliate placement

Day 5: @TESTING @DEPLOYMENT
  → Run all tests
  → Launch checklist review
  → Deploy to production
```

---

## Non-Negotiable Standards

Every agent follows these without exception:

```
Security:
✓ All inputs validated with Zod
✓ All text sanitised with DOMPurify
✓ Rate limiting on all public endpoints
✓ Auth verified on all operator routes
✓ Prices calculated server-side only
✓ Stripe webhooks signature-verified
✓ QR tokens HMAC-signed
✓ No secrets in code or git

Code Quality:
✓ TypeScript strict mode throughout
✓ No 'any' types
✓ Explicit return types on functions
✓ Error handling on all async operations
✓ No console.log in production code
✓ Internal errors never exposed to clients

Design:
✓ Navy #0C447C primary
✓ Flat design — no gradients
✓ Inter font only
✓ Anchor ⚓ as loading symbol
✓ Mobile-first 390px base
✓ Min 44px tap targets

Database:
✓ RLS on every table
✓ Service role key server-side only
✓ Parameterised queries always
✓ GDPR soft-delete pattern
```

---

## Package.json Reference

```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "react-dom": "18.3.0",
    "typescript": "5.4.0",
    
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.3.0",
    
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^3.0.0",
    "@stripe/react-stripe-js": "^2.0.0",
    
    "@upstash/redis": "^1.28.0",
    "ioredis": "^5.3.0",
    "bullmq": "^5.0.0",
    
    "resend": "^3.2.0",
    "twilio": "^5.0.0",
    "web-push": "^3.6.0",
    
    "zod": "^3.22.0",
    "isomorphic-dompurify": "^2.4.0",
    
    "i18next": "^23.0.0",
    "react-i18next": "^14.0.0",
    "i18next-browser-languagedetector": "^8.0.0",
    
    "qrcode.react": "^3.1.0",
    "pdf-lib": "^1.17.0",
    "html2canvas": "^1.4.0",
    
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    
    "lucide-react": "^0.383.0",
    "framer-motion": "^11.0.0",
    "next-pwa": "^5.6.0",
    
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "vitest": "^1.4.0",
    "@playwright/test": "^1.43.0",
    "msw": "^2.2.0",
    "@vitest/coverage-v8": "^1.4.0"
  }
}
```

---

## Project Health Indicators

```
Green (healthy):
  ✓ All tests passing
  ✓ No TypeScript errors
  ✓ No npm audit high/critical
  ✓ Lighthouse > 90
  ✓ Stripe webhooks receiving
  ✓ Weather cache hit rate > 80%

Amber (investigate):
  ⚠ Test coverage < 80% on security utils
  ⚠ Any failed Stripe webhook
  ⚠ Redis memory > 80%
  ⚠ Supabase connection pool > 80%

Red (fix immediately):
  ✗ Any security test failing
  ✗ RLS policies disabled
  ✗ Secrets found in code
  ✗ Stripe payment failures > 2%
  ✗ Registration API error rate > 1%
```
