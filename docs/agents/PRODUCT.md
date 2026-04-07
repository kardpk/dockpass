# DockPass — Master Product Context
# Read this before any other agent document

## What is DockPass?

DockPass (dockpass.io) is a PWA webapp that solves the unowned gap
in the charter boat industry: everything that happens between
"booking confirmed" and "guest steps on the boat."

Owned by: Oakmont Logic LLC (Wyoming, USA)
Domain: dockpass.io
Stack: Next.js + Supabase + Redis + Render + Vercel

---

## The Core Concept

One shareable trip link per booking.
Operator sends it once.
Every guest self-registers individually.
No app download. No login for guests.
Works in any language, any country.

---

## The Three Users

### 1. Operator (pays $49–$179/month)
- Charter boat owner or fleet manager
- Sets up boat profile once
- Creates trips in 30 seconds
- Monitors guest check-in dashboard
- Downloads passenger manifest PDF
- Copies pre-written WhatsApp message

### 2. Guest (free, no account)
- Opens shared trip link
- Enters 4-char trip code
- Registers: name, emergency contact, dietary
- Signs digital waiver
- Orders add-ons
- Receives QR boarding pass
- Downloads postcard after trip

### 3. Captain (no account, no login)
- Receives read-only snapshot via share button
- Sees: guest list, waiver status, alerts, add-ons
- Updated live as guests register
- No DockPass account required ever

---

## Pricing Tiers

| Tier    | Boats    | Price    |
|---------|----------|----------|
| Solo    | 1 boat   | $49/mo   |
| Captain | 2–3 boats| $89/mo   |
| Fleet   | 4–10     | $179/mo  |
| Marina  | Unlimited| $349/mo  |

Annual billing: 20% discount

---

## Revenue Streams

1. Subscriptions (primary)
2. Add-on commissions (8% of orders)
3. Insurance affiliate (Novamar / BoatUS)
4. Florida boating course affiliate (NASBLA)
5. Marina partnerships ($349/mo)
6. Post-trip postcard (free but drives referrals)

---

## Target Markets (in order)

1. Miami, Florida (launch)
2. Fort Lauderdale, Florida
3. Spain — Mallorca, Ibiza, Barcelona
4. Italy — Amalfi, Sicily, Sardinia
5. Croatia — Dalmatian Coast
6. All US coastal cities

---

## Guest Flow (exact sequence)

1. Receive WhatsApp message with trip link + code
2. Open link → see trip page (public, no auth)
3. Tap "Join this trip"
4. Enter 4-char trip code (soft gate)
5. Fill personal details form
6. Sign digital waiver
7. Select language preference
8. Order add-ons (optional)
9. Receive QR boarding pass
10. Add to home screen (PWA prompt)
11. Post-trip: rate + download postcard

---

## Trip Page Sections (in order)

1. Hero: boat name, date, time, duration, marina
2. Weather widget (live, Open-Meteo)
3. Find Your Dock (marina, slip, parking, Maps link)
4. Meet Your Captain (photo, bio, license, languages)
5. What to Bring (tickable checklist)
6. Boat Rules (operator's house rules)
7. Safety Briefing (life jackets, emergency contacts)
8. Today's Route (Leaflet map + stop pills)
9. On Board Info (WiFi, amenities)
10. Full Cost Breakdown (itemised, no surprises)
11. Cancellation Policy (colour-coded timeline)
12. Add-Ons Available (browse before joining)
13. Join This Trip (sticky CTA button)

---

## Operator Dashboard Sections

1. Home: today's charter status, guest progress
2. Trips: create, manage, view all trips
3. Trip Detail: guest list, waiver status, add-ons
4. Revenue: subscriptions, add-on revenue, stats
5. Reviews: monitor, AI-draft responses
6. Guests: past guests, rebooking sequences
7. Boat Profile: setup, edit, manage fleet
8. Settings: billing, account, notifications

---

## Key Design Decisions

- Navy #0C447C primary
- White #FFFFFF background
- Flat design — no gradients
- Inter font throughout
- ⚓ anchor as loading animation (rocks 1.2s)
- Border radius: cards 16px, buttons 12px
- Transitions: 250ms ease-in-out, slide left/right
- Mobile-first, 390px base
- PWA installable
- Multilingual: EN, ES, PT, FR, DE, IT, RU

---

## Non-Negotiable Features (MVP)

1. Boat profile setup with URL scraper (Boatsetter/GetMyBoat)
2. Trip creation (30 seconds)
3. Shared guest link (one link, all guests)
4. Digital waiver (legally binding, timestamped)
5. Florida boating course affiliate (bareboat only)
6. Trip insurance affiliate
7. Add-on menu + ordering
8. QR boarding pass (cryptographically signed)
9. Live weather widget
10. Captain snapshot (read-only, no login)
11. Operator dashboard
12. Passenger manifest PDF
13. Post-trip postcard generator (1080x1080)
14. Multilingual auto-detection

---

## What DockPass Is NOT

- Not a booking platform (does not compete with Boatsetter)
- Not a marketplace for finding boats
- Not a payment processor for charter fees
- Not an Airbnb for boats
- It is the layer AFTER booking is confirmed

---

## Business Entity

Company: Oakmont Logic LLC
State: Wyoming, USA
Product: DockPass
Domain: dockpass.io
Banking: Mercury Bank (US)
Payments: Stripe (US account)
