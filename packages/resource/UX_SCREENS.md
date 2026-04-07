# DockPass — UX Screens Agent
# @UX_SCREENS
# See @MASTER for full implementation sequence

---

## CRITICAL ASSESSMENT FIRST

The PDF blueprint describes 11 screens across
three journeys. Before building anything, you
need to understand what to build, what to skip,
and what the PDF got brilliantly right.

---

## The Core Conflict — Marketplace vs Experience Layer

```
THE PDF IMPLIES:                 WHAT DOCKPASS ACTUALLY IS:

Passenger searches boats    →   WRONG: Boatsetter does this
Passenger books a charter   →   WRONG: GetMyBoat does this
Secure checkout flow        →   WRONG: Competing with funded platforms
Full marketplace            →   WRONG: 6+ months, wrong strategy

Post-booking experience     →   CORRECT: This is our gap
Digital boarding pass       →   CORRECT: Core product
Slide to Start Trip         →   CORRECT: BRILLIANT addition
Captain command center      →   CORRECT: Operational tool
Guest pre-trip companion    →   CORRECT: What we built
```

**Decision:**
Screens 1–3 of the Passenger side (Landing/Search/Boat Detail)
are a marketplace. Do NOT build these in MVP.
They compete with Boatsetter and require supply+demand
simultaneously — a classic marketplace chicken-and-egg problem.

**Instead:** The DockPass landing page is an OPERATOR acquisition
page (B2B SaaS), not a passenger search page.

---

## What the PDF Got Brilliantly Right

```
1. "Slide to Start Trip" toggle → Buoy API
   THE single best UX idea in this document.
   One swipe at the dock = insurance activated,
   trip logged, guests notified, timer started.
   Must build. Priority 1.

2. Safety Briefing swipe acknowledgment
   Instead of just showing text, guest swipes
   through safety cards and confirms each one.
   Legally stronger than a checkbox.
   Much better than what we had.

3. Passenger countdown timer + "View My DockPass"
   Trip anticipation is emotionally important.
   "2 days 14 hours until your charter" drives
   re-engagement and pre-trip preparation.
   Great UX addition.

4. Protection Hub for Tint.ai tiers
   Free vs Premium framing is cleaner than
   what we designed. Use this approach.

5. Insurance traffic light (Green/Red/Amber)
   Simple visual on captain dashboard for
   coverage status. Much cleaner than text.

6. Chat between guest and captain
   For dock navigation questions ("Where exactly
   do I park?") this is genuinely needed.
   Supabase Realtime makes it trivial to build.

7. Apple Wallet boarding pass aesthetic
   Better framing than what we had.
   Position it explicitly as an Apple/Google
   Wallet alternative — guests understand instantly.
```

---

## One Important Flag

```
The PDF references St. Petersburg FL throughout
(Maximo Marina, Loggerhead Marina, 7901 4th St N).
This is a different market from our Miami research.

Decision: St. Pete is a valid secondary market.
Our launch market remains Miami.
Keep Miami in all demo content and first operator
outreach. St. Pete enters month 3.

St. Pete charter hubs to research later:
  Maximo Marina (3300 Pinellas Bayway S)
  Loggerhead Marina (2995 Gandy Blvd)
  Harborage Yacht Club (1 Harborage Dr)
```

---

## Final Screen Architecture (Intelligent Merge)

### SECTION A — Public / Marketing

```
SCREEN A1 — dockpass.io (Operator Landing Page)
Type: Static, SSG, SEO-optimised
Goal: Convert visiting charter operators to sign up
NOT: A passenger search page

Above the fold:
  Headline: "Your charter experience, in one link"
  Sub: "Digital waivers, boarding passes, add-ons
       and weather — all sent to guests before
       they arrive."
  CTA: "Start free 14-day trial" [primary navy]
       "See a live demo →" [ghost]

Demo strip (most important section):
  Show a live DockPass link opening on a phone
  The boarding pass. The weather. The waiver.
  Not a video — an actual embedded live demo

Social proof:
  Operator ratings from Boatsetter
  ("Operators like Jiri, 992 ratings, use DockPass")

Pricing table:
  Solo $49 / Captain $89 / Fleet $179 / Marina $349
  Annual toggle (20% off)

Footer: Privacy / Terms / Contact
        hello@dockpass.io / +1 (786) XXX-XXXX

Tech: Next.js 15 SSG (fastest possible, SEO-perfect)
      No auth required, no Supabase query
```

---

### SECTION B — Operator Portal (Supply Side)

```
SCREEN B1 — Operator Signup + Boat Setup Wizard
Type: Multi-step form, Server Actions
Goal: Operator fully onboarded in 10 minutes

Step 1/6 — Account
  Email, password, name, company name
  "Already listing on Boatsetter/GetMyBoat?"
  [Yes → show URL import] [No → manual]

Step 2/6 — Import or manual
  Paste Boatsetter URL → scraper fills all fields
  Review and confirm imported data
  Manual path: boat name, type, year, capacity

Step 3/6 — Marina + Dock
  Marina name, address, slip number
  Parking instructions
  Mapbox pin — tap to set exact location

Step 4/6 — Captain
  Name, photo upload, bio
  USCG license number
  Languages, years experience

Step 5/6 — Rules + Waiver
  Pre-filled template by boat type
  Fully editable
  What to bring / boat rules / cancellation policy

Step 6/6 — Add-ons + Protection Hub
  Add menu items (name, price, emoji)
  Protection Hub introduction:
    [Basic — free] includes digital waivers
    [Premium — $49/mo add-on] includes Tint.ai
    platform liability, priority placement

Progress bar at top throughout
AnchorLoader between steps
Confirm → redirect to dashboard

Tech: Server Actions, Zod, Supabase insert
      Apify for URL scraping
      Stripe Connect onboarding trigger
```

---

```
SCREEN B2 — Operator Dashboard (Home)
Type: SSR, Supabase Realtime
Goal: Morning-of command center

Top greeting card:
  "Good morning, Conrad ☀️
   You have 1 charter today"

Today's trip card (navy):
  Boat name + date + time
  Guest progress: "7 / 8 checked in"
  Progress bar (teal fill)
  Waiver status: "7 signed · 1 pending"
  [Send reminder] [View guest list →]

Insurance traffic light (from PDF):
  🟢 Green: "Trip covered — Buoy active"
  🟡 Amber: "Insurance expires in 3 days"
  🔴 Red: "Action required — coverage lapsed"
  Tap: links to Protection Hub

Quick stats row (3 cards):
  [Bookings this month: 12]
  [Add-on revenue: $340]
  [Avg rating: 4.9 ★]

Today's guest list:
  SM Sofia M.    🥂 🤿   ✓ Signed
  CR Carlos R.          ✓ Signed
  AK Ahmed K.    ✗ Pending ← amber row

Action buttons:
  [📋 Download manifest PDF]
  [📤 Copy WhatsApp message]
  [+ Create new trip]

Insight card (bottom):
  "Champagne is up 40% this month.
   Feature it first in your add-on menu."

Bottom nav: Home / Trips / Revenue / Guests

Tech: Supabase Realtime for live guest updates
      Render worker for insight calculations
```

---

```
SCREEN B3 — Create Trip
Type: Server Action form
Goal: New trip link in 30 seconds

Form:
  Which boat? [dropdown]
  Date [date picker]
  Time [time picker]
  Duration [2hr / 3hr / 4hr / 6hr / 8hr]
  Max guests [number, pre-fills from boat]
  Booking type: [Private] [Split bookings]
  Approval mode: [Auto] [Manual review]
  Trip code [4-char, auto-generated, editable]
  Special notes [optional, 1 field]

[Generate trip link →]

On success:
  Big navy card:
  "Your trip link is ready ⚓"
  dockpass.io/trip/[slug]
  [Copy link]
  
  Pre-written WhatsApp message:
  "Hi! Everything for our charter Saturday
   is here: [link] — join with code [CODE]"
  [Copy message]
  
  Trip code displayed large: SUN4

Tech: Server Actions, generateTripSlug(), Redis
```

---

```
SCREEN B4 — Trip Detail + Guest Management
Type: SSR + Realtime
Goal: Full trip visibility and control

Trip header:
  Boat name · date · time · slip
  Status badge: Upcoming / Active / Completed

Guest table:
  Each row: avatar + name + waiver + addons + status
  Pending rows: amber background
  Action per row: [View waiver] [Remove] [Approve]

Capacity indicator:
  "7 / 8 checked in"
  Circular progress visual

Add-on orders:
  Grouped by item:
  🥂 Champagne ×2 — Sofia M, Carlos R
  🤿 Snorkel kit ×1 — Maria L

Action bar (sticky bottom):
  [Download manifest PDF] → pdf-lib generates
  [Copy WhatsApp message] → pre-written
  [Share to captain →] → generates snapshot token

Captain snapshot preview:
  Shows read-only version captain will see

Tech: Supabase Realtime, pdf-lib, HMAC token
```

---

```
SCREEN B5 — Fleet / Boat Management
Type: CRUD
Goal: Manage all boats, block dates, pricing

Boat cards list:
  Photo + name + type + capacity + status badge
  [Edit] [View live page] [Block dates]

Calendar view (from PDF):
  Month view
  Click date → [Available] [Blocked] toggle
  Weekend pricing toggle (future: dynamic pricing)

Insurance status per boat:
  🟢 🟡 🔴 traffic light (from PDF)
  Tap to upload certificate

BoatUS affiliate card:
  "Protect your vessel"
  "BoatUS towing membership — $30 referral"
  [Learn more →] ← affiliate link with UTM

Tech: Supabase, Render worker for calendar sync
```

---

```
SCREEN B6 — Protection Hub (from PDF)
Type: Subscription management
Goal: Sell Tint.ai premium tier

Two-column layout:

Basic (Included):
  ✓ Digital waivers
  ✓ Guest pre-trip experience
  ✓ Boarding passes
  ✓ Passenger manifests

Premium — $49/month add-on:
  ✓ Everything in Basic
  ✓ Platform liability protection (Tint.ai)
  ✓ Priority placement in search
  ✓ DockPass Guarantee badge on guest page
  ✓ Dedicated support
  [Upgrade to Premium →] ← Stripe billing

Insurance document vault:
  Secure upload zone
  [Upload Commercial Liability Policy]
  Stored in Supabase Storage
  Tint.ai API checks coverage status

Tech: Stripe billing, Tint.ai API, Supabase Storage
```

---

```
SCREEN B7 — Revenue Dashboard
Type: Analytics
Goal: Show operators their money

Header: "Revenue overview"
Month selector: < October 2024 >

Hero stat (navy card):
  $4,280 this month
  +18% vs September (teal badge)

Grid of 4 stats:
  [12 charters] [142 guests]
  [$340 add-ons] [4.9★ avg]

Bar chart:
  6 months of revenue
  Current month: teal
  Others: navy 30%

Add-on breakdown:
  🥂 Champagne ×8    $680
  📸 Photographer ×3  $450
  🤿 Snorkel kits ×6  $270

Insight card:
  "Your add-on revenue is up 40%.
   Champagne is your top seller."

Tech: Render worker for calculations
      Redis cache for chart data
```

---

### SECTION C — Guest Journey (The Actual DockPass)

```
SCREEN C1 — Guest Trip Page
Type: SSR + Redis cached
Goal: Complete pre-trip preparation

Sections in order:
  C1.1 Hero (navy): boat name, date, chips, marina
  C1.2 Weather widget: live, colour-coded
  C1.3 Find Your Dock: address, slip, Maps link
  C1.4 Meet Your Captain: photo, bio, license
  C1.5 Safety Briefing: expandable cards
  C1.6 What to Bring: tickable checklist
  C1.7 Boat Rules: bullet list
  C1.8 Route Preview: Mapbox pin + stops
  C1.9 On Board Info: WiFi, amenities
  C1.10 Cost Breakdown: itemised
  C1.11 Cancellation Policy: colour timeline
  C1.12 Add-Ons: browse (disabled steppers)
  C1.13 DockPass Guarantee: if operator enabled

Sticky bottom: "Join this trip →"

Trip states:
  upcoming → full page + join flow available
  active    → "Head to Slip X" banner + chat open
  completed → post-trip screen

Tech: Next.js SSR, Open-Meteo, Mapbox, Redis
```

---

```
SCREEN C2 — Join Flow (Bottom Sheet)
Type: Client component, 4 steps
Goal: Guest checks in privately

Step 1 — Trip code
  4-char monospace input
  Rate limited: 5 attempts → 30min lockout
  Hint: "Check your organiser's message"

Step 2 — Personal details
  Full name*, Emergency contact*, phone*
  Dietary requirements (optional)
  Language pills: 🇬🇧 🇪🇸 🇵🇹 🇫🇷 🇩🇪 🇮🇹
  DOB (optional — for Florida course check)
  GDPR consent (EU guests only)

Step 3 — Safety briefing swipe (NEW from PDF)
  Instead of one checkbox:
  Swipeable safety cards, one per rule:
    Card 1: "Life jackets are under seat 3"
            [Understood ✓]
    Card 2: "This vessel stays in Biscayne Bay only"
            [Understood ✓]
    Card 3: "No glass bottles on deck"
            [Understood ✓]
  Guest swipes through all cards
  EACH card individually acknowledged
  Legally stronger than one checkbox
  Progress indicator: "3 of 6 rules reviewed"

Step 4 — Waiver signing
  Scrollable waiver text (with scroll progress)
  Checkbox: "I have read and agree"
  Cursive signature field
  Submit records IP + timestamp + user agent

Step 4.5 — Insurance + Course (conditional)
  If guest DOB after 1988 + bareboat:
    → Florida course requirement
  Insurance affiliate card (always show)
  DockPass Guarantee option (if operator enabled)

Step 5 — Add-ons
  Full add-on cards with quantity steppers
  [Complete Check-in] or [Skip]

Step 6 — Confirmation + Boarding Pass
  "You're checked in! ✓"
  Apple Wallet boarding pass aesthetic (from PDF):
    DOCKPASS header
    Boat name bold
    Date · Time · Duration (3 columns)
    ──✂── dashed divider
    QR code (HMAC signed, 160×160)
    Slip · Marina
    Guest name
  Summary pills: ✓ Waiver / 🥂 Champagne / ✓ Course
  PWA install banner
  Chat button (if trip is active)

Tech: Server Actions, Zod, Supabase, qrcode.react
      HMAC signing, rate limiting, Redis
```

---

```
SCREEN C3 — Guest Boarding Pass (standalone view)
Type: Client component (saved/revisited)
Goal: Fast access on charter day

Detects: localStorage has guest session
Shows: QR code immediately (full screen)
       No need to re-open join flow

Active state (charter day):
  Blue banner: "Your captain is ready"
  "Head to Slip 14A · Miami Beach Marina"
  Live chat button (opens C4)

Weather update (live):
  "Today's conditions: 84°F · Perfect"

Emergency contacts (prominent on charter day):
  🚔 Coast Guard: VHF Ch 16
  ⚓ Marina: (305) XXX-XXXX

Tech: localStorage, Supabase Realtime
```

---

```
SCREEN C4 — Guest ↔ Captain Chat (from PDF)
Type: Client component, Supabase Realtime
Goal: Quick dock navigation questions

Simple chat interface (not full messaging):
  Only opens when trip status = 'active'
    OR guest manually requests it
  Shows: messages between this guest and captain
  Operator sees all messages in dashboard

Suggested quick questions (chips):
  "Where exactly do I park? 🅿️"
  "I'm running 10 minutes late"
  "Which dock entrance do I use?"
  "I'm at the marina now"
  Tap → sends immediately, no typing needed

Captain sees all chats from all guests
  in one unified thread per trip

Auto-close when trip status = 'completed'
Post-close: "Your captain has ended the session.
            Hope you had an amazing trip! ⭐"

Tech: Supabase Realtime channel per trip
      Message rate limit: max 20/hour
```

---

### SECTION D — Captain Experience

```
SCREEN D1 — Captain Snapshot (read-only, no login)
Type: Public, time-limited token
Goal: Captain knows everything before boarding

Auto-generated when operator taps "Share to Captain"
Token expires: 1 hour after trip start time

Sections:
  Trip header: date, time, boat, slip, weather
  
  Passenger alerts (from guest safety responses):
    ⚠️ 2 non-swimmers
    👶 1 child under 12 → life jacket required
    💊 3 seasickness prone
    🥜 1 nut allergy (Sofia M.)
  
  Guest list:
    Each row: name + waiver ✓/✗ + addons + language flag
    Pending waivers: amber highlight
  
  Add-ons ordered:
    🥂 Champagne ×2 (Sofia, Carlos)
    🤿 Snorkel kit ×1 (Maria)
  
  DockPass Guarantee status (if applicable)

Tech: HMAC token, Redis TTL, read-only Supabase query
```

---

```
SCREEN D2 — "Slide to Start Trip" Toggle ★ KEY SCREEN
Type: Captain view (from shared link or snapshot)
Goal: Legal trigger for insurance + trip activation

This is the most legally important screen in DockPass.
Every charter operator needs to see this.

Visual design:
  Full-screen, clean
  Large teal banner: "Ready to depart?"
  
  Pre-departure checklist (must confirm each):
    ☑ All guests accounted for
    ☑ Safety briefing given
    ☑ Life jackets accessible
    ☑ Weather conditions acceptable
    ☑ Passenger manifest downloaded
  
  Guest count confirmation:
    "7 of 8 guests checked in.
     1 guest has not signed waiver: Ahmed K."
    [Proceed anyway] [Wait for Ahmed] ← captain decides

  THE BIG BUTTON (from PDF):
    Massive teal button, full width
    "SLIDE TO START TRIP →"
    Slider interaction — must slide fully to activate
    Cannot accidentally tap
    
    Confirmation overlay:
    "Starting trip for 7 guests on
     Conrad's Yacht Miami
     Saturday Oct 21 · 2:00 PM"
    [Confirm start] [Cancel]

  On confirm:
    → Trip status = 'active' in Supabase
    → Buoy API webhook fires (insurance activates)
    → All guests receive push notification:
      "⚓ Your charter has started!
       Welcome aboard Conrad's Yacht"
    → Chat unlocks for all guests
    → USCG timestamp logged in database
    → Operator dashboard updates in real-time

  Post-start screen:
    "Trip is active ✓"
    Buoy policy number displayed
    Insurance: "🟢 Active · Policy #BUY-XXXXX"
    [End trip] button (shows when ready to dock)

Tech: Server Action, Buoy API webhook,
      Supabase Realtime, Web Push, Redis lock
      (prevent double-start)
```

---

```
SCREEN D3 — End Trip
Type: Captain action
Goal: Close the charter, trigger post-trip flows

Simple screen:
  "End this charter?"
  Trip duration: "Started 2hr 14min ago"
  
  [Slide to End Trip →] ← same slider UX
  
  On confirm:
    → Trip status = 'completed'
    → Buoy API: policy ends
    → BullMQ queues: review request emails (2hr delay)
    → Post-trip page activates for all guest links
    → Operator revenue updated

Tech: Server Action, BullMQ, Buoy API
```

---

### SECTION E — Post-Trip

```
SCREEN E1 — Post-Trip Review + Postcard
Type: SSR (trip page in completed state)
Goal: Reviews + viral sharing

Teal hero:
  "Hope you had an amazing time! 🌊"
  "— Conrad & the DockPass team"

Review gate:
  "How was your experience?"
  ★★★★★ (large, tappable)
  
  4-5 stars → review links appear:
    [Review on Google →]
    [Review on Boatsetter →]
  
  1-3 stars → private feedback:
    "Tell us what went wrong"
    Text field → goes to operator (not public)
    [Send private feedback]

Postcard section (unlocks after rating):
  "Your trip postcard is ready 🎉"
  Preview: 1080×1080 with 3 styles
    [Classic Nautical] [Modern Minimal] [Sunset Miami]
  Guest name, boat name, captain, date, weather
  ⚓ dockpass.io watermark
  [Download] [Share to Instagram]

Rebook section:
  "Ready for another adventure?"
  [Book Conrad's Yacht again →] ← Boatsetter/direct link

Referral section:
  🎁 "Share with a friend"
  "You both get 10% off your next charter"
  [Share referral link]

Tech: html2canvas, Supabase, BullMQ (triggered by End Trip)
```

---

## Complete Screen List (Priority Order)

```
PHASE 1 — MVP (build in this exact order):

  B1   Operator signup + boat setup wizard
  B3   Create trip
  C1   Guest trip page (all 13 sections)
  C2   Guest join flow (4 steps + confirmation)
  C3   Guest boarding pass standalone
  B2   Operator dashboard home
  B4   Trip detail + guest management
  D1   Captain snapshot (read-only)
  D2   SLIDE TO START TRIP ← highest priority
  D3   End trip
  E1   Post-trip review + postcard
  A1   Landing page (operator acquisition)

PHASE 2 — Growth (after first paying customer):

  C4   Guest ↔ Captain chat
  B5   Fleet/boat management + calendar
  B6   Protection Hub (Tint.ai)
  B7   Revenue dashboard
  
PHASE 3 — Scale:

  Passenger Dashboard (countdown timer)
  Advanced analytics
  White-label for marinas
  Multi-captain per boat
```

---

## Revised Build Sequence For IDE

```
Week 1:
  @MASTER @DATABASE @SECURITY
  → Database schema + RLS
  
  @MASTER @FRONTEND @BACKEND
  → B1: Operator signup + boat setup
  → B3: Create trip (30 seconds)

Week 2:
  @MASTER @FRONTEND @DESIGN
  → C1: Guest trip page (all sections)
  → C2: Join flow (safety swipe cards)

Week 3:
  @MASTER @BACKEND @COMPLIANCE
  → D2: Slide to Start Trip + Buoy API ← DO THIS EARLY
  → C3: Boarding pass standalone
  → D1: Captain snapshot

Week 4:
  @MASTER @FRONTEND @BACKEND
  → B2: Operator dashboard
  → B4: Trip detail
  → E1: Post-trip + postcard
  → A1: Landing page
```

---

## The Safety Briefing Upgrade (Implement This)

```typescript
// Replace the single waiver checkbox with
// swipeable safety cards

interface SafetyCard {
  id: string
  title: string
  description: string
  icon: string
  acknowledged: boolean
}

// Operator configures safety cards per boat
// Pre-filled templates by boat type:

const motorboatSafetyCards: SafetyCard[] = [
  {
    id: 'life-jackets',
    title: 'Life Jackets',
    description: 'Life jackets are located under the bow seats. Children must wear one at all times.',
    icon: '🦺',
    acknowledged: false,
  },
  {
    id: 'operating-area',
    title: 'Operating Area',
    description: 'This vessel operates within Biscayne Bay only. It cannot go into open ocean.',
    icon: '🗺️',
    acknowledged: false,
  },
  {
    id: 'no-glass',
    title: 'No Glass on Deck',
    description: 'All beverages must be in plastic or cans. No glass bottles anywhere on deck.',
    icon: '🥤',
    acknowledged: false,
  },
  {
    id: 'swimming',
    title: 'Swimming Safety',
    description: 'Only swim when the captain gives the OK. Always enter water feet-first.',
    icon: '🏊',
    acknowledged: false,
  },
  {
    id: 'emergency',
    title: 'Emergency Procedure',
    description: 'If in distress: Call US Coast Guard on VHF Channel 16 or dial 911.',
    icon: '🚨',
    acknowledged: false,
  },
]

// Guest must tap "Understood ✓" on each card
// before waiver signing becomes available
// All acknowledgments logged with timestamp
// Each card = separate row in safety_acknowledgments table

// Legal value: 5 individual timestamped confirmations
// vs 1 checkbox. Dramatically stronger in any dispute.
```

---

## Slide to Start Trip — Full Implementation Notes

```typescript
// This is the most important legal moment in DockPass
// Three things happen simultaneously on swipe:

// 1. Trip status update
await supabase
  .from('trips')
  .update({
    status: 'active',
    started_at: new Date().toISOString(),
    started_by_captain: captainName,
    guest_count_at_start: confirmedGuestCount,
  })
  .eq('id', tripId)

// 2. Buoy API webhook (Florida Livery Law)
await activateTripPolicy({
  tripId,
  operatorId,
  guestCount: confirmedGuestCount,
  ...boatDetails,
})
// Returns: policyId stored in trips.buoy_policy_id

// 3. Push notifications to all checked-in guests
for (const guest of checkedInGuests) {
  await sendPush(guest.pushSubscription, {
    title: `⚓ Your charter has started!`,
    body: `Welcome aboard ${boatName}. 
           Have an amazing trip!`,
    url: `/trip/${tripSlug}`,
  })
}

// 4. Unlock chat channel for this trip
await supabase
  .from('trip_chat_channels')
  .insert({ trip_id: tripId, status: 'active' })

// 5. Log USCG-relevant departure record
await supabase
  .from('audit_log')
  .insert({
    action: 'trip_started',
    entity_type: 'trip',
    entity_id: tripId,
    changes: {
      started_at: new Date().toISOString(),
      guest_count: confirmedGuestCount,
      buoy_policy_id: policyId,
      marina: marinaName,
      lat: marinaLat,
      lng: marinaLng,
    }
  })

// IMPORTANT: Prevent double-start
// Redis lock: set trip:started:{tripId} for 24hr
// If lock exists: show "Trip already started"
```

---

## Screen States Summary

```
EVERY screen handles these states:
  Loading:   AnchorLoader (⚓ rocking)
  Empty:     Helpful empty state with CTA
  Error:     User-friendly message, no internals
  Offline:   PWA cached version or offline banner
  Expired:   Clear expiry message (snapshot, etc.)

Trip page specifically:
  upcoming   → full page, join available
  active     → "Head to dock" banner + chat
  completed  → post-trip screen
  cancelled  → "This trip was cancelled"
  
Boarding pass specifically:
  pre-trip   → countdown timer
  day-of     → QR + dock directions prominent
  active     → "Captain started trip" banner
  post-trip  → "Hope you had fun" + postcard
```
