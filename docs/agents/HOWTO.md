# DockPass — How To Build Each Feature
# @HOWTO

## How to use this document

For every feature below, copy the exact
@ command shown, paste into Antigravity IDE
terminal, then follow the numbered steps
in order. Do not skip steps.

---

## FEATURE 1 — Project Setup

**Agents:** @AGENTS @ARCHITECTURE @DEPLOYMENT

**Steps:**
1. Create new Next.js 14 project with TypeScript strict
2. Install all packages from AGENTS.md package.json
3. Create folder structure exactly as in ARCHITECTURE.md
4. Create .gitignore — include .env, .env.local, .env.production
5. Create .env.local with all variables from ARCHITECTURE.md
6. Set up Tailwind CSS with custom colours from DESIGN.md
7. Add Inter font via next/font in layout.tsx
8. Add anchor keyframe animation to globals.css
9. Create /docs/agents/ folder and paste all .md files
10. Initialise git, create private GitHub repo, push
11. Connect repo to Vercel (auto-deploy on push to main)
12. Connect repo to Render (worker service)
13. Verify Vercel preview URL works
14. Done — foundation is live

---

## FEATURE 2 — Supabase Setup

**Agents:** @DATABASE @SECURITY @DEPLOYMENT

**Steps:**
1. Create new Supabase project (US East region)
2. Copy SUPABASE_URL and keys to .env.local
3. Open Supabase SQL editor
4. Run the full schema from DATABASE.md in this order:
   - operators table
   - boats table
   - addons table
   - trips table
   - bookings table
   - guests table
   - guest_addon_orders table
   - trip_reviews table
   - postcards table
   - operator_notifications table
   - audit_log table
5. Run all CREATE INDEX statements from DATABASE.md
6. Run all RLS ENABLE statements
7. Run all CREATE POLICY statements
8. Run all trigger functions
9. Run gdpr_cleanup function
10. Run auto_activate_trips function
11. Create storage bucket: boat-photos (public read)
12. Test: try to query guests table without auth — should return nothing
13. Test: create operator, log in, query their boats — should work
14. Done — database is secure

---

## FEATURE 3 — Operator Auth

**Agents:** @BACKEND @SECURITY @FRONTEND @DESIGN

**Steps:**
1. Create /app/(auth)/login/page.tsx
2. Create /app/(auth)/signup/page.tsx
3. Build login form: email + password fields, primary button
4. Build signup form: name + email + password + confirm
5. Use Supabase Auth (createBrowserClient) for both
6. On signup: insert operator record in operators table
7. On login success: redirect to /dashboard
8. Create lib/security/auth.ts with requireOperator() function
   (exact code in SECURITY.md section 9)
9. Add auth middleware.ts to protect /dashboard/* routes
10. Test: access /dashboard without login — should redirect to /login
11. Test: login with valid credentials — should reach dashboard
12. Test: wrong password — should show error, not internal details
13. Done — auth is working

---

## FEATURE 4 — Boat Profile Setup

**Agents:** @FRONTEND @BACKEND @DATABASE @SECURITY @DESIGN

**Steps:**
1. Create /app/dashboard/boats/new/page.tsx
2. Build 6-step wizard (see PRODUCT.md operator onboarding):
   - Step 1: Boat name, type dropdown, capacity, year
   - Step 2: Marina name, address, slip, parking, map pin
   - Step 3: Captain name, photo upload, bio, license, languages
   - Step 4: What to bring (editable checklist from template)
   - Step 5: House rules + waiver text (editable template)
   - Step 6: Add-on menu (add items with name, price, emoji)
3. Pre-fill templates based on boat type selection
4. Photo upload: validate MIME + magic bytes (SECURITY.md section 5)
5. Store captain photo in Supabase storage bucket
6. POST /api/dashboard/boats — insert to boats table
7. Add StepTransition animation between steps (FRONTEND.md)
8. Add AnchorLoader on save button while submitting
9. On complete: redirect to /dashboard with success message
10. Test: submit with missing required fields — should block
11. Test: upload non-image file — should reject
12. Test: SQL injection in boat name field — should be sanitised
13. Done — operator can create their boat profile

---

## FEATURE 5 — Boatsetter URL Import

**Agents:** @BACKEND @SECURITY @ARCHITECTURE

**Steps:**
1. Add import option to boat setup step 1
2. Show input: "Paste your Boatsetter/GetMyBoat listing URL"
3. POST /api/dashboard/boats/import
4. In API route:
   a. Validate URL against allowlist (SECURITY.md section 4)
   b. Check rate limit: max 5 scrapes/hour per operator
   c. Call Apify API with the URL
   d. Parse response: extract name, rules, photos, capacity
   e. Return structured boat data
5. Pre-fill all wizard fields from scraped data
6. Show: "We found your boat — review and confirm"
7. Operator edits anything that looks wrong
8. Saves as normal boat profile
9. Test: paste a non-Boatsetter URL — should reject
10. Test: paste internal URL (127.0.0.1) — should reject
11. Test: exceed rate limit — should get 429 error
12. Done — 30-second boat setup via paste

---

## FEATURE 6 — Trip Creation

**Agents:** @FRONTEND @BACKEND @DATABASE @SECURITY @DESIGN

**Steps:**
1. Create /app/dashboard/trips/new/page.tsx
2. Build trip creation form (minimal — 30 seconds):
   - Select boat (dropdown of operator's boats)
   - Date picker
   - Time picker
   - Duration dropdown (2hr/3hr/4hr/6hr/8hr/custom)
   - Max guests (pre-fills from boat capacity)
   - Trip code (auto-generated 4-char, editable)
   - Booking type: Private / Open (split bookings)
   - Approval required: yes/no toggle
   - Special notes (optional, one field)
3. POST /api/dashboard/trips
4. Generate slug with generateTripSlug() (SECURITY.md section 1)
5. Generate trip code with generateTripCode()
6. Insert trip record to database
7. On success: show trip detail page with:
   - The trip link: dockpass.io/trip/{slug}
   - Pre-written WhatsApp message (tap to copy)
   - Trip code prominently displayed
8. Copy button for WhatsApp message
9. Test: create trip — verify slug is non-guessable
10. Test: create trip — verify trip code is 4 uppercase chars
11. Done — operator can create and share trips

---

## FEATURE 7 — Guest Trip Page

**Agents:** @FRONTEND @BACKEND @DATABASE @DESIGN

**Steps:**
1. Create /app/(public)/trip/[slug]/page.tsx (SSR)
2. Fetch trip + boat data server-side (DATABASE.md query pattern)
3. Build each section as separate component (FRONTEND.md):
   - TripHero (navy background, boat name, chips, marina)
   - WeatherWidget (fetch from /api/weather — BACKEND.md)
   - DockFinder (marina, address, slip badge, Maps button)
   - CaptainProfile (circular photo, name, rating, license, bio)
   - PackingChecklist (tickable, state in localStorage)
   - BoatRules (bullet list)
   - SafetyBriefing (expandable rows, light blue background)
   - RouteMap (Leaflet.js, marina pin, route stops)
   - OnboardInfo (WiFi, amenities, JSONB from boat)
   - CostBreakdown (itemised, right-aligned amounts)
   - CancellationPolicy (colour-coded timeline dots)
   - AddOnBrowser (cards with disabled steppers + hint text)
4. Sticky bottom bar: "Join this trip →" button
5. Handle trip states:
   - upcoming: full page, registration open
   - active: "Head to Slip X" banner at top
   - completed: redirect to post-trip review page
   - cancelled: "This trip has been cancelled" screen
6. Cache trip data in Redis (5 min TTL)
7. Set weather cache (3 hour TTL)
8. Test: open trip page — all sections load
9. Test: open on mobile 390px — no horizontal scroll
10. Test: open in Spanish browser — UI in Spanish
11. Done — guest trip page is live

---

## FEATURE 8 — Join Flow (Guest Registration)

**Agents:** @FRONTEND @BACKEND @SECURITY @DATABASE @DESIGN

**Steps:**
1. Create JoinSheet.tsx bottom sheet container
2. Build 4 step components (FRONTEND.md):
   a. StepCode: 4-char input, monospace, large font
   b. StepDetails: name, emergency contact, dietary, language pills
   c. StepWaiver: scrollable text, checkbox, cursive signature field
   d. StepAddons: add-on cards with quantity steppers, skip button
3. Add StepTransition animation between steps (FRONTEND.md)
4. Add step indicator dots at top of sheet
5. Wire up useJoinFlow state machine (FRONTEND.md)
6. Connect step 1 to POST /api/trips/[slug]/validate-code
7. Connect step 3 completion to POST /api/trips/[slug]/register
   (full implementation in BACKEND.md)
8. Connect step 4 to POST /api/trips/[slug]/addons
9. On completion: show StepConfirmation with:
   - "You're checked in!" navy hero
   - QR boarding pass with dashed border (DESIGN.md)
   - Guest name, boat name, slip, marina
   - Summary pills: waiver signed, addons ordered
   - PWA install banner
10. Rate limiting: 5 wrong codes = 30 min lockout
11. Show Florida course notice if bareboat + born after 1988
12. Show insurance affiliate card after waiver step
13. Test: enter wrong code 5 times — verify lockout
14. Test: submit with empty name — should block
15. Test: XSS in name field — should be sanitised
16. Test: complete full flow — verify guest in database
17. Test: open QR code — verify HMAC signature valid
18. Done — guest can fully check in

---

## FEATURE 9 — Operator Dashboard

**Agents:** @FRONTEND @BACKEND @DATABASE @DESIGN

**Steps:**
1. Create /app/dashboard/page.tsx (home)
2. Build dashboard layout with bottom nav:
   - Home, Trips, Revenue, Guests (DESIGN.md bottom nav)
3. Home screen components:
   - Greeting card: "Good morning, [name] ☀️"
   - Today's trip card (navy, guest progress bar)
   - 3 quick stat cards: bookings, add-on revenue, rating
   - Today's guest list table
4. Guest list table shows per row:
   - Initials avatar, name, waiver badge, addon emojis
   - Ahmed K. pending row highlighted amber
5. Action buttons:
   - Download manifest PDF
   - Copy WhatsApp message
   - Create new trip
6. Insight card at bottom (add-on trends)
7. Use Supabase realtime for live guest list updates
8. Use useOperatorNotifications hook (NOTIFICATIONS.md)
9. Weather alert banner if advisory for upcoming trip
10. Test: guest registers — dashboard updates without refresh
11. Test: access another operator's trip ID — should 403
12. Done — operator can manage everything from dashboard

---

## FEATURE 10 — Captain Snapshot

**Agents:** @BACKEND @FRONTEND @SECURITY @DATABASE

**Steps:**
1. Create /app/(public)/snapshot/[token]/page.tsx
2. Add "Share to Captain" button in trip detail view
3. POST /api/dashboard/trips/[id]/snapshot
   - Generate time-limited signed token (1 hour expiry)
   - Token = HMAC(tripId + timestamp, secret)
   - Store token in Redis with 1 hour TTL
4. Share button opens native share sheet with URL
5. Captain opens URL — no login, no account
6. Snapshot page shows (read-only, no actions):
   - Trip date, time, boat name, slip
   - Guest list: name, waiver status, alerts, addon icons
   - Passenger alerts section:
     * Non-swimmers count
     * Children under 12
     * Seasickness prone
     * Dietary requirements
   - Add-ons ordered summary
   - Weather widget
7. Page auto-refreshes every 60 seconds
8. After 1 hour: token expires, page shows "Snapshot expired"
9. Test: access snapshot URL — shows guest list
10. Test: try to edit anything — no edit controls present
11. Test: access expired token — shows expired message
12. Done — captain gets everything, no account needed

---

## FEATURE 11 — Passenger Manifest PDF

**Agents:** @BACKEND @COMPLIANCE @DATABASE

**Steps:**
1. GET /api/dashboard/manifest/[tripId]
2. Verify operator owns this trip
3. Fetch all guests for trip (DATABASE.md query pattern)
4. Generate PDF using pdf-lib (BACKEND.md implementation):
   - Header: DockPass logo, vessel name, date, time, marina
   - Table: #, full name, emergency contact, dietary, waiver status
   - Footer: generated timestamp, dockpass.io
   - USCG format requirements (COMPLIANCE.md)
5. Return PDF as downloadable file (Content-Disposition: attachment)
6. Add "Download manifest PDF" button in dashboard
7. AnchorLoader while generating
8. Test: download PDF — verify all guests listed
9. Test: verify USCG required fields present
10. Test: guest with special dietary — appears in PDF
11. Done — USCG compliant manifest in one tap

---

## FEATURE 12 — Weather Monitoring + Cancellation

**Agents:** @BACKEND @NOTIFICATIONS @REDIS @DATABASE

**Steps:**
1. Render hourly cron: checkUpcomingWeather()
2. For each trip in next 48 hours:
   a. Fetch weather for trip location and date
   b. Check WMO code against thresholds
   c. If code >= 80 (storm): create weather alert
3. Store alert in operator_notifications table
4. Push notification to operator dashboard (realtime)
5. Email operator with alert (NOTIFICATIONS.md template)
6. Operator taps alert in dashboard → opens modal:
   - Weather description + severity
   - Pre-written guest notification message (editable)
   - Reschedule date options (3 dates auto-suggested)
   - "Send to all guests" button
7. On confirm: update trip status to 'cancelled'
8. Notify all guests simultaneously via:
   - Email (if provided)
   - Push notification (if PWA installed)
9. Show rebooking options to each guest
10. Test: manually set WMO code to 95 — verify alert fires
11. Test: send cancellation — verify all guests notified
12. Done — weather workflow is automated

---

## FEATURE 13 — Stripe Subscriptions

**Agents:** @PAYMENTS @BACKEND @SECURITY

**Steps:**
1. Create Stripe account (Oakmont Logic LLC)
2. Create 4 products in Stripe dashboard:
   Solo Captain / Captain / Fleet / Marina
3. Create monthly + annual prices for each
4. Copy price IDs to PAYMENTS.md PLANS object
5. POST /api/billing/checkout (PAYMENTS.md)
6. POST /api/billing/portal (for manage billing)
7. POST /api/webhooks/stripe (PAYMENTS.md full handler)
8. Register webhook in Stripe dashboard:
   dockpass.io/api/webhooks/stripe
   Events: checkout.session.completed,
           customer.subscription.updated,
           customer.subscription.deleted,
           invoice.payment_failed
9. Build billing page in dashboard:
   - Current plan display
   - Upgrade prompt when boat limit reached
   - "Manage billing" button (opens Stripe portal)
10. Test with Stripe test cards:
    - 4242 4242 4242 4242 — success
    - 4000 0000 0000 9995 — decline
11. Test: webhook fires — operator tier updates in DB
12. Test: cancel subscription — operator downgraded
13. Done — billing is live

---

## FEATURE 14 — Insurance + Course Affiliates

**Agents:** @BACKEND @FRONTEND @COMPLIANCE @DATABASE

**Steps:**
1. Apply to Novamar Insurance affiliate program
   (with Oakmont Logic LLC details)
2. Apply to BoatUS affiliate program
3. Apply to Boat-Ed.com or NASBLA course affiliate
4. Get affiliate links for each
5. Store affiliate links in environment variables
   (never hardcoded, easy to swap)
6. Insurance card placement in join flow:
   Between step 3 (waiver) and step 4 (addons)
   Show card: "Protect your trip"
   → Link to Novamar with UTM params
   Add required disclosure (COMPLIANCE.md)
7. Course card placement:
   Only show if bareboat charter AND guest born
   after Jan 1 1988 (COMPLIANCE.md logic)
   Show card: "Florida requires this — 3 hours online"
   → Link to Boat-Ed with UTM params
8. Track affiliate clicks in audit_log table
9. Add UTM parameters to all affiliate links:
   utm_source=dockpass&utm_medium=checkin&utm_campaign=trip
10. Test: captained charter — insurance shows, course hidden
11. Test: bareboat + DOB after 1988 — course shows
12. Test: bareboat + DOB before 1988 — course hidden
13. Done — passive revenue streams active

---

## FEATURE 15 — Postcard Generator

**Agents:** @FRONTEND @BACKEND @DATABASE @DESIGN

**Steps:**
1. Trigger: trip status changes to 'completed'
2. Guest opens same trip link — sees post-trip screen
3. Post-trip screen components:
   - Teal hero: "Hope you had an amazing time! 🌊"
   - 5-star rating (private — required to unlock postcard)
   - If 4-5 stars: Google + Boatsetter review links appear
   - If 1-3 stars: private feedback textarea appears
   - "Download your postcard" section below rating
4. Build PostcardGenerator component (FRONTEND.md)
5. 3 style choices: Classic / Minimal / Sunset
6. Postcard auto-fills from trip data:
   - Guest first name
   - Boat name + captain name
   - Date + actual weather on that day
   - Marina name
   - ⚓ dockpass.io watermark bottom right
7. html2canvas renders at 1080x1080px
8. Download button saves to camera roll
9. Share button opens native share sheet
10. Save postcard record to postcards table
11. Test: generate postcard — verify all data correct
12. Test: download — verify 1080x1080 PNG
13. Test: watermark present at bottom right
14. Done — viral marketing engine is live

---

## FEATURE 16 — Multilingual Support

**Agents:** @FRONTEND @COMPLIANCE

**Steps:**
1. Set up i18next (FRONTEND.md config)
2. Create translation files for each language:
   /lib/i18n/locales/en.json (complete — FRONTEND.md)
   /lib/i18n/locales/es.json (translate all strings)
   /lib/i18n/locales/pt.json
   /lib/i18n/locales/fr.json
   /lib/i18n/locales/de.json
   /lib/i18n/locales/it.json
   /lib/i18n/locales/ru.json
3. Replace ALL hardcoded UI text with t('key') calls
4. Language auto-detects from navigator.language
5. Language pill selector in trip page hero (flag + name)
6. Language pill selector in join flow step 2
7. Save language preference to guests table
8. Set <html lang={language}> dynamically
9. Review + request emails sent in guest's language
   (NOTIFICATIONS.md review email template)
10. Test: set browser to Spanish — UI renders in Spanish
11. Test: change language mid-flow — persists
12. Test: unknown language — falls back to English
13. Done — global ready

---

## FEATURE 17 — PWA + Push Notifications

**Agents:** @FRONTEND @NOTIFICATIONS @DEPLOYMENT

**Steps:**
1. Add next-pwa to next.config.ts (FRONTEND.md)
2. Create /public/manifest.json (FRONTEND.md)
3. Add icons: icon-192.png and icon-512.png (navy anchor)
4. Generate VAPID keys for push:
   npx web-push generate-vapid-keys
   → Add to environment variables
5. Build PWA install prompt component (DESIGN.md)
   Show after guest completes check-in
6. Service worker handles offline:
   - Caches trip page for offline viewing
   - Shows offline banner if no connection
7. Push subscription: ask permission after QR shown
8. Store push subscription in Supabase
9. Send push via Render worker (NOTIFICATIONS.md)
10. Push types to implement:
    - "Your charter is tomorrow ⚓" (24hr before)
    - "How was your trip?" (2hr after)
    - "⚠️ Weather update" (if advisory)
11. Test: install PWA on iOS — icon appears on home screen
12. Test: go offline — trip page still loads
13. Test: receive push notification on Android
14. Done — native app experience without app store

---

## FEATURE 18 — GDPR + Compliance

**Agents:** @COMPLIANCE @BACKEND @DATABASE @FRONTEND

**Steps:**
1. Create /app/(public)/privacy/page.tsx
   (full privacy policy from COMPLIANCE.md)
2. Create /app/(public)/terms/page.tsx
   (terms of service key clauses from COMPLIANCE.md)
3. Cookie banner for EU users only (COMPLIANCE.md)
   Detect country from Cloudflare CF-IPCountry header
4. GDPR consent checkbox in join flow step 2
   (only shown to EU guests)
5. POST /api/gdpr/delete endpoint (COMPLIANCE.md)
6. Add "Delete my data" link in trip confirmation footer
7. Run GDPR cleanup cron weekly (DATABASE.md function)
8. Waiver disclaimer on operator setup (COMPLIANCE.md)
9. Insurance affiliate disclosure (COMPLIANCE.md)
10. Update manifest PDF with USCG required fields
11. Test: EU guest — GDPR checkbox appears
12. Test: non-EU guest — no cookie banner
13. Test: delete request — data anonymised in DB
14. Test: 90 days cron — old records anonymised
15. Done — legally compliant in US and EU

---

## FEATURE 19 — Review Automation

**Agents:** @NOTIFICATIONS @BACKEND @DATABASE

**Steps:**
1. Render hourly cron: processReviewRequests()
2. Find all trips where:
   - status = 'completed'
   - trip_date + duration + 2 hours < NOW()
   - review_requested_at IS NULL
3. For each completed trip:
   a. Update: review_requested_at = NOW()
   b. Queue review request job in BullMQ
4. Worker sends review request email
   (NOTIFICATIONS.md template, in guest's language)
5. Review request links to trip page with ?review=true
6. Trip page in completed state shows star rating
7. 4-5 stars → Google + Boatsetter review links
8. 1-3 stars → private feedback textarea
9. Save rating to trip_reviews table
10. Operator dashboard Review tab:
    - Platform rating pills (Google, Boatsetter, GetMyBoat)
    - Latest reviews with AI draft response button
    - Negative reviews highlighted coral with urgency
11. AI draft response uses Claude API with operator context
12. Test: complete trip → wait 2 hours → email arrives
13. Test: 5-star → review links appear
14. Test: 2-star → private form appears, no public links
15. Done — review engine is automated

---

## FEATURE 20 — Past Guests + Rebooking

**Agents:** @BACKEND @NOTIFICATIONS @DATABASE @FRONTEND

**Steps:**
1. Build /app/dashboard/guests/page.tsx
2. Search bar + filter pills: All / Active / At risk / Lapsed
3. Guest rows showing:
   - Name, last trip, amount spent, rating, days since trip
   - "At risk" = 45-90 days since last trip (amber)
   - "Lapsed" = 90+ days (coral)
4. "Send rebooking offer" button per guest
5. Tapping generates pre-written message:
   "Hi [name]! It was great having you on [boat].
    We have dates available in [month] — 
    would you like to book again?"
   Operator copies and sends via WhatsApp/email
6. Render cron daily: send automated rebooking emails
   For guests at 60-day mark (with email on file)
   (NOTIFICATIONS.md rebooking email template)
7. Referral tracking: if guest refers another,
   both get 10% off next charter (tracked in DB)
8. Test: create guest + trip 61 days ago → in "at risk"
9. Test: tap "send offer" → message copied to clipboard
10. Test: 60-day cron → rebooking email queued
11. Done — retention engine is active

---

## General Rules for Every Feature

```
Before coding any feature:
1. Read the relevant agent .md files first
2. Check @SECURITY.md — does this touch user data?
3. Check @DESIGN.md — use exact colours and components
4. Check @DATABASE.md — is there an existing query pattern?

While coding:
5. TypeScript strict — no 'any' types
6. Sanitise ALL inputs (isomorphic-dompurify + Zod)
7. Rate limit ALL public API endpoints
8. Verify auth on ALL operator API endpoints
9. Calculate prices server-side ONLY
10. Never log sensitive data

After coding:
11. Write unit tests for security-critical logic
12. Test on mobile (390px) before desktop
13. Test the unhappy path (wrong input, network error)
14. Verify no console.log left in production code
15. Check @DEPLOYMENT.md launch checklist section

Commit message format:
feat: add guest registration with rate limiting
fix: sanitise waiver signature field
security: add SSRF protection to scraper endpoint
```
