# BoatCheckin — Automation & Support Agent
# @AUTOMATION

## Role
You own the automated support system for BoatCheckin.
No human intervention for 95% of issues.
Every expected problem has a pre-built resolution.
Escalation only for genuine edge cases.
Reference @NOTIFICATIONS.md for messaging.
Reference @BACKEND.md for API patterns.

---

## Automation Philosophy

```
Level 1 — Self-service (guest/operator solves it)
  Product UI prevents the issue entirely
  Or product UI explains the fix inline

Level 2 — Auto-resolve (system fixes it silently)
  Background job detects and resolves
  User notified of resolution
  No action required

Level 3 — AI-assisted response (Claude API)
  User submits support request
  Claude drafts response using context
  Response sent automatically
  Flagged for review only if sentiment negative

Level 4 — Human escalation (you or Pakistan hire)
  Billing disputes
  Legal questions
  Abuse reports
  Complex technical failures
  < 5% of total volume
```

---

## PART 1 — GUEST AUTOMATED ISSUES

### Issue G1: Wrong trip code

```
Trigger: Guest enters wrong code

Automated response (inline UI):
  Attempt 1-2: "Incorrect code — check your organiser's message"
               Show hint: "It's 4 letters, like SUN4"
  Attempt 3:   "Still not working? Check you're using
                the right link for your booking"
               Show: "Contact your organiser" button
               Pre-fills message: "Hi — can you resend
               the BoatCheckin trip code?"
  Attempt 4:   Same as above + show email support link
  Attempt 5:   Rate limit lockout
               "Too many attempts. Try again in 30 minutes.
                Or ask your organiser to resend the code."

Auto-resolution:
  Operator dashboard shows: "Guest having code trouble"
  notification after 3 failed attempts on their trip
  Operator can tap: "Resend trip details" →
  Pre-written WhatsApp message generated
  No support ticket needed
```

### Issue G2: Can't find the dock

```
Trigger: Guest submits "help" via trip page chat
         OR opens Maps link and comes back

Automated response:
  AI chat on trip page context-aware:
  System prompt includes:
    - Marina full address
    - Slip number
    - Parking instructions
    - Google Maps deeplink
    - Captain phone (if operator enabled)

  Guest asks: "Where exactly do I go?"
  AI responds: "Head to [marina address].
  Look for Slip [number] — it's [direction from entrance].
  Free parking is [parking instructions].
  Here's the map: [Maps link]"

  Always ends with: "Still lost? Tap here to
  call the marina office: [number]"

Auto-escalation: None needed
```

### Issue G3: Link expired or trip cancelled

```
Trigger: Guest opens link for cancelled trip

Automated UI response:
  "This trip has been cancelled by the operator.
   If you believe this is an error, contact
   your booking platform (Boatsetter/GetMyBoat)
   for a refund."
  
  Show: relevant platform contact links
  Do NOT show: operator contact details
  (protects operator from direct harassment)

Auto-resolution: None — no action needed from system
```

### Issue G4: Already registered, lost confirmation

```
Trigger: Guest opens trip link after registering
         (same device — detected via localStorage)

Automated UI response:
  "Welcome back, [name]!
   You're already checked in for this trip."
  
  Show: their QR boarding pass again
  Show: trip details summary
  Show: their add-on orders
  
  No re-registration required
  No support needed
```

### Issue G5: QR code not scanning at dock

```
Trigger: Captain reports QR not scanning
         OR guest reports issue

Automated fallback built into Captain snapshot:
  Captain taps guest name in snapshot
  Sees: full guest details + waiver confirmed timestamp
  Manual check-off button: "Mark as boarded"
  
  QR failure never blocks boarding
  Guest name lookup always available as backup
  
Auto-resolution: Fallback is built in — no issue
```

### Issue G6: Guest wants to cancel add-on order

```
Trigger: Guest submits support email
         "I ordered champagne by mistake"

Automated AI response:
  Detect: add-on cancellation request
  Check: is trip more than 24hrs away?

  If yes (24+ hours):
    Auto-cancel the order in database
    Email guest: "Your [add-on] order has been cancelled.
    No charge was made."
    Notify operator dashboard

  If no (less than 24hrs):
    Email guest: "Your trip is too close to cancel add-ons.
    Please speak with your captain at the dock."
    Notify operator: "Guest [name] wants to cancel [add-on]"

No human intervention needed for either case
```

### Issue G7: Guest wants data deleted (GDPR)

```
Trigger: Email to privacy@boatcheckin.com
         OR form at boatcheckin.com/privacy#delete

Automated flow:
  1. System receives deletion request
  2. Auto-sends confirmation email:
     "We've received your request. Your data will be
      deleted within 72 hours as required by GDPR."
  3. Cron job processes deletion within 72 hours
  4. Auto-sends completion email:
     "Your BoatCheckin data has been deleted."
  5. Logs deletion in audit_log

No human involvement required
Fully GDPR Article 17 compliant
```

---

## PART 2 — OPERATOR AUTOMATED ISSUES

### Issue O1: Forgot trip link

```
Trigger: Operator emails support / submits help form
         "I can't find the link for my Saturday trip"

Automated flow:
  AI detects: trip link request
  Looks up: all upcoming trips for this operator
  Auto-responds:
    "Here are your upcoming trip links:
    
    Saturday Oct 21 · 2pm — Conrad's Yacht Miami
    Link: boatcheckin.com/trip/[slug]
    Code: SUN4
    WhatsApp message: [pre-written, tap to copy]
    
    Sunday Oct 22 · 11am — Conrad's Yacht Miami
    Link: boatcheckin.com/trip/[slug2]
    Code: OCT3"

No human needed. Resolved in seconds.
```

### Issue O2: Guest list not updating

```
Trigger: Operator contacts support
         "Guests are checking in but I can't see them"

Automated diagnosis:
  1. Check: is operator browser tab stale?
     → Auto-response: "Your guest list updates live.
       Try refreshing the page — pull down to refresh
       on mobile."
  
  2. Check: is Supabase realtime connection healthy?
     → If unhealthy: auto-failover to polling (30s refresh)
     → Notify engineering via Render alert
     → Operator sees no interruption
  
  3. Check: are guests actually registered?
     → If yes: send operator direct email with guest count
     → If no: "No guests have checked in yet.
               Share this link with your group: [link]"

Auto-resolution in all three cases
```

### Issue O3: Photo upload failing

```
Trigger: Operator reports captain photo not uploading

Automated diagnosis:
  Check file type → if wrong: inline error message
    "Only JPEG, PNG, and WebP files accepted"
  
  Check file size → if too large: inline error message
    "Photo must be under 5MB.
     Try compressing at squoosh.app (free)"
  
  Check Supabase storage health → if down:
    Show: "Photos are temporarily unavailable.
           Your boat profile has been saved.
           Add your photo when you're back online."
    Queue the upload for retry

No support ticket needed — all resolved in UI
```

### Issue O4: Stripe payment failed

```
Trigger: Stripe webhook: invoice.payment_failed

Automated sequence:
  Day 1 (immediate):
    Email: "Your BoatCheckin payment didn't go through.
            No action needed yet — we'll retry in 3 days.
            [Update payment method] if needed."
    Dashboard: amber banner "Payment issue — please update billing"
    Account: still fully active

  Day 4 (Stripe auto-retry):
    If successful: email "Payment successful — all good!"
    If failed again: email "Still having payment issues.
                    Please update your card to keep BoatCheckin active."
    Account: still active

  Day 7 (final notice):
    Email: "Your account will be paused in 24 hours.
            [Update payment method now]"
    Account: still active

  Day 8:
    Account: paused (trips still viewable, no new trips)
    Email: "Account paused. [Reactivate now]"
    Data: fully preserved for 30 days

  Day 38 (30 days after pause):
    Email: "Your account will be closed in 7 days.
            [Reactivate to keep your data]"

No human needed until operator contacts support
```

### Issue O5: Boatsetter scraper returns empty/wrong data

```
Trigger: Operator pastes URL, gets empty fields
         or wrong information imported

Automated response (inline):
  "We couldn't read all your listing details.
   This sometimes happens with new listings
   or unusual formatting.
   
   We've pre-filled what we could find:
   [show whatever was extracted]
   
   Please fill in the remaining fields manually.
   Takes about 5 minutes."

  Show: pre-filled wizard with empty fields highlighted
  Show: link to their original listing in new tab
  
  Fallback is always manual entry — scraper is
  an acceleration tool, not a dependency
```

### Issue O6: Guest waiver not signed before trip

```
Trigger: Cron detects trip in 24hrs with unsigned waivers

Automated sequence:
  1. Operator dashboard: red badge on trip
     "3 guests haven't signed their waiver"
  
  2. Push notification to operator:
     "⚠️ 3 unsigned waivers for tomorrow's trip"
  
  3. Operator taps: "Send reminder"
     System generates per-guest reminder SMS text
     Operator copies and sends (one tap per guest)
  
  4. If still unsigned at T-2 hours:
     Operator gets final push: "2 guests still unsigned"
     Operator decides whether to proceed
     
  5. Day of trip — captain snapshot shows:
     [!] symbol next to unsigned guests
     Captain is aware at boarding

No guest is blocked from boarding — operator decides
Operator always has complete picture
```

### Issue O7: Trip code lost / organiser can't find it

```
Trigger: Operator emails "my client lost the trip code"

Automated flow:
  AI detects: trip code request
  Verifies: operator owns this trip
  Responds:
    "The trip code for [date] [boat] is: [CODE]
     
     Here's the full message to resend to your group:
     [pre-written WhatsApp message with code + link]
     
     Tap to copy and send to your organiser."

Resolved instantly. No human needed.
```

### Issue O8: Operator wants to transfer account to new email

```
Trigger: "I changed my email address"

Automated response:
  "To update your email address securely,
   please verify your current email first.
   
   We've sent a verification link to [old email].
   Click it within 24 hours to confirm the change.
   
   Your new email: [new email entered]
   This change will apply after verification."

Supabase handles email change flow natively
No human needed
```

### Issue O9: Duplicate trip created by mistake

```
Trigger: Operator emails "I created the same trip twice"

Automated resolution:
  Show in dashboard: "This trip has 0 guests registered"
  + "Delete this trip" button (only available if 0 guests)
  
  If guests already registered on wrong trip:
    Cannot auto-delete (safety)
    AI response: "Since guests have already checked in,
    we can't delete this trip automatically.
    Please reply with the trip date and we'll
    sort this out manually."
    → Escalate to Level 4 (human)
```

---

## PART 3 — SYSTEM AUTOMATED ISSUES

### Issue S1: Weather API unavailable

```
Trigger: Open-Meteo returns error or times out

Automated failover:
  1. Try Open-Meteo (primary)
  2. If fails: serve cached weather (last known)
  3. Show: "Weather data from [X hours ago]" label
  4. If cache also empty: hide weather widget entirely
     Show: "Weather temporarily unavailable"
     Trip page still fully functional without it

No support tickets generated
User experience degrades gracefully
```

### Issue S2: Supabase connection issues

```
Trigger: Supabase returns 503 or connection timeout

Automated response:
  All API routes: catch Supabase errors
  Return user-facing message:
    "We're having a brief service interruption.
     Your data is safe. Please try again in 1 minute."
  
  Retry logic: 3 attempts with exponential backoff
  If all fail: return 503 to client
  
  Guest trip page: served from Redis cache
  (most read operations unaffected)
  
  Write operations (registration, orders):
    Queue in Redis for retry
    Show user: "Saving your details..."
    Process within 60 seconds when DB recovers
```

### Issue S3: Email delivery failure (Resend)

```
Trigger: Resend returns error or bounce

Automated handling:
  Hard bounce (invalid email):
    Mark email as invalid in guests table
    Fall back to SMS if phone number available
    Log bounce in audit_log
  
  Soft bounce (temporary):
    Retry after 1 hour (BullMQ job)
    Retry again after 4 hours
    After 3 failures: mark as failed, log
  
  Operator email fails:
    Retry same pattern
    If persistent: show in-app notification instead
    Never silently drop

No support needed — all handled automatically
```

### Issue S4: Stripe webhook delivery failure

```
Trigger: Stripe cannot reach webhook endpoint

Automated handling:
  Stripe retries automatically for 3 days
  Webhook endpoint is idempotent
  (same event processed twice = no double update)
  
  If operator subscription shows wrong tier:
    Reconciliation cron runs daily:
      Fetch all active Stripe subscriptions
      Compare with Supabase operator tiers
      Fix any mismatches automatically
      Log corrections in audit_log

No human needed
```

### Issue S5: QR scan fails at dock (camera issue)

```
Trigger: Captain reports QR not scanning

Automated fallback UI on captain snapshot:
  Each guest row has:
  [QR] [Name] [Status] [Manually board ✓]
  
  Captain taps "Manually board" →
  Confirms: "Board [name] manually?"
  → Marks as checked_in_at with manual flag
  
  Waiver still confirmed — this is just boarding
  Zero operational disruption

No support needed
```

### Issue S6: Redis cache becomes unavailable

```
Trigger: Upstash returns error

Automated fallback:
  Rate limiting: fail open (allow request through)
  Weather cache: fetch directly from Open-Meteo
  Trip cache: fetch directly from Supabase
  
  Performance degrades slightly
  No features break entirely
  
  Log: redis_unavailable event
  Alert: Render webhook to Slack/email
```

---

## PART 4 — AI SUPPORT CHAT (Claude API)

### Setup

```typescript
// app/api/support/route.ts
// Powers the help chat bubble on all pages

const SUPPORT_SYSTEM_PROMPT = `
You are the BoatCheckin support assistant.
BoatCheckin is a charter boat guest experience app.
You help operators and guests with questions.

CONTEXT YOU HAVE ACCESS TO:
- Trip details if guest is on a trip page
- Operator account info if they are logged in
- Common issue resolutions listed below

RESOLUTION KNOWLEDGE BASE:
[inject all issues from this document]

RULES:
- Always be warm and brief (mobile-first)
- Never promise features that don't exist
- Never discuss competitor platforms negatively
- For billing disputes: always escalate to human
- For legal questions: always say "contact us at hello@boatcheckin.com"
- For data deletion: direct to boatcheckin.com/privacy#delete
- End every response with a confirmation question
  "Does that solve your issue?"

If you cannot resolve: say exactly
"I'll connect you with our team — expect a reply within 4 hours."
Then flag for human review.
`
```

### Conversation routing

```typescript
// Auto-categorise every support message

type SupportCategory =
  | 'trip_code'          → auto-resolve (send code)
  | 'dock_location'      → auto-resolve (send map link)
  | 'waiver_issue'       → auto-resolve (resend link)
  | 'addon_cancellation' → auto-resolve (cancel if > 24hr)
  | 'billing'            → escalate to human
  | 'legal'              → escalate to human
  | 'data_deletion'      → auto-resolve (GDPR flow)
  | 'account_access'     → auto-resolve (password reset)
  | 'feature_request'    → log + auto-acknowledge
  | 'bug_report'         → log + notify engineering
  | 'abuse'              → immediate human escalation
  | 'unknown'            → AI handles, flag if negative sentiment
```

---

## PART 5 — EXPECTED EDGE CASES

### Edge Case E1: Guest registers with wrong name

```
Situation: Sofia registers as "Sofía Martínez" but
           should be "Sofia M" as per organiser

Resolution:
  Guest cannot edit their own registration
  (security — prevents impersonation)
  
  Operator can edit guest name in dashboard:
    Trip detail → tap guest → edit name
  
  Waiver remains valid — signature text preserved
  Change logged in audit_log

No support ticket needed
Operator self-serves in dashboard
```

### Edge Case E2: Boat capacity exceeded

```
Situation: Trip set for 8 max but 9 people in group

Resolution (automated, in join flow):
  Guest tries to register when trip is full:
  "This trip is currently full (8/8 guests).
   Ask your organiser to contact the captain
   to confirm if additional guests are accepted."
  
  Operator dashboard shows trip as full
  Operator can increase max_guests if safe to do so
  (boat capacity from profile is advisory not hard lock
   — operator is responsible for USCG compliance)
```

### Edge Case E3: Same person registers twice

```
Situation: Guest refreshes form and submits twice
           or uses two devices

Detection:
  Check: same full_name + same trip_id
  If duplicate detected within 10 minutes:
    Return the existing registration
    Show: existing QR code
    Do not create duplicate record

If genuinely two people with same name:
  Both registrations valid
  Operator sees both in guest list
  Different QR tokens for each
```

### Edge Case E4: Trip date passes without guests

```
Situation: Operator created trip, nobody registered

Automated handling:
  Trip auto-moves to 'completed' status
  No guests = blank manifest
  No review requests sent (nobody to email)
  Operator sees: "0 guests attended" in trip history
  
  Insight card: "This trip had no registrations.
  Consider sharing the link earlier next time."
  
  No support needed
```

### Edge Case E5: Operator deletes boat with active trips

```
Prevention (UI):
  "Delete boat" button checks for upcoming trips
  If upcoming trips exist:
  "This boat has 2 upcoming trips.
   Cancel those trips first before deleting the boat."
  
  Button stays disabled until trips cancelled
  
  If no upcoming trips:
    Boat soft-deleted (is_active = false)
    Historical trip data preserved
    Past guests can still view their trip pages
```

### Edge Case E6: Guest opens link on day of trip (active state)

```
Situation: Guest forgot to check in beforehand
           Opens link morning of charter

Automated handling:
  Trip in 'active' state:
  Blue banner: "Your charter is today! ⚓"
  
  If not yet registered:
    Join flow still works — abbreviated version
    "Quick check-in — just your name + waiver"
    Code step still required
    Dietary + language simplified
    QR issued immediately
  
  If already registered:
    QR boarding pass shown immediately
    "Head to Slip [X] — captain is expecting you"
```

### Edge Case E7: Bad weather but operator wants to proceed

```
Situation: Weather alert fires but operator
           decides conditions are acceptable

Automated handling:
  Weather alert shows in dashboard
  Operator has full control:
    [Proceed with trip] button
    → Clears alert
    → Optionally sends guests weather update:
      "Our captain has reviewed today's conditions
       and confirmed the trip is proceeding.
       [Current conditions: X]"
  
  BoatCheckin never cancels trips automatically
  Operator always has final decision
  System just informs — never overrides
```

### Edge Case E8: Insurance affiliate link broken

```
Situation: Novamar affiliate URL returns 404

Automated detection:
  Daily health check cron:
  Fetches all affiliate links
  Checks HTTP status
  
  If 404/500:
    Hide that affiliate card from all trip pages
    Log: affiliate_link_broken event
    Email you: "Novamar affiliate link broken — please update"
  
  No guest sees broken link
  No support tickets generated
```

### Edge Case E9: Operator tries to access trial after it expires

```
Situation: 14-day trial ended, not upgraded

Automated handling:
  Day 13: Email "Your trial ends tomorrow"
           Dashboard banner: "1 day left in trial"
  
  Day 14 (expiry):
    Dashboard locked — shows upgrade prompt only
    All trip data preserved
    All guest links still work (guests unaffected)
    Operator cannot create new trips or links
    
  Day 14 + 30 (grace period):
    Email: "Your account will be closed in 7 days"
    
  Day 14 + 37:
    Account closed
    Data exported and emailed to operator
    Data deleted from database
```

### Edge Case E10: Operator in Spain — EU GDPR applies

```
Situation: Spanish operator signs up
           Their guests are EU data subjects

Automated detection:
  Operator signup: detect country from IP + billing address
  If EU country detected:
    Supabase EU region selected for their data
    GDPR consent flow enabled for their trip pages
    Data Processing Agreement shown at signup
    Cookie banner enabled for their guests
    Data deletion flow available to their guests
  
  All automatic — operator doesn't configure anything
```

---

## PART 6 — SUPPORT SYSTEM INFRASTRUCTURE

### Help widget on every page

```typescript
// components/shared/SupportWidget.tsx
// Floating button bottom right — does NOT conflict with
// existing coral menu button on guest pages

// On operator dashboard: support chat always available
// On guest trip pages: "Need help?" link in footer only
// (Keep guest page clean — no floating widget)

// Widget opens:
// 1. Search FAQ (instant, no API call)
// 2. AI chat if FAQ doesn't resolve
// 3. Email escalation if AI can't resolve
```

### FAQ content (instant, no AI needed)

```
Most common questions and their answers:
Pre-built as static content — zero API cost

"How do I share the trip link?"
→ Copy the link from your trip detail page
  and send it to your group organiser.

"A guest can't check in"
→ Check they have the correct 4-letter trip code.
  Find it in your trip detail page.

"How do I change the waiver text?"
→ Go to Boats → edit your boat → update waiver section.

"Can I add a new add-on to an existing trip?"
→ Yes — go to your boat profile and add the add-on.
  It appears on all future trip pages automatically.

"How does billing work?"
→ Monthly subscription charged to your saved card.
  Manage at Dashboard → Settings → Billing.

"How do I cancel my subscription?"
→ Settings → Billing → Manage Billing → Cancel plan.
  Your account stays active until the billing period ends.
```

### Escalation email setup

```
support@boatcheckin.com → your email (hidden)
All Level 4 escalations routed here
Target response time: 4 business hours

Auto-acknowledgement sent immediately:
"Thanks — we've received your message.
 Our team will reply within 4 hours.
 
 Reference: [auto-generated ticket number]"

Tracking: simple Airtable or Notion database
Pakistan hire monitors and responds
You review billing + legal only
```

### Monitoring alerts (you are notified only for critical)

```
You receive alerts for:
  → Stripe payment failure spike (>5 in 1 hour)
  → Registration error rate > 2%
  → Supabase down > 5 minutes
  → Any abuse report
  → Any legal/threat email

You do NOT receive alerts for:
  → Individual support tickets
  → Routine password resets
  → FAQ questions
  → Minor scraper failures
  → Single email bounces

Your Pakistan hire handles:
  → All Level 3 AI-flagged conversations
  → All non-critical support tickets
  → Feature requests (log them)
  → Review of AI draft responses
```

---

## Implementation Priority

```
Week 1 (before launch):
  □ FAQ static content
  □ All inline error messages (UI level)
  □ Weather API failover
  □ Stripe payment sequence (automated)
  □ Rate limiting on trip codes

Week 2 (at launch):
  □ AI support chat (Claude API)
  □ Operator notification system
  □ Auto-trip status management
  □ Waiver reminder automation

Week 3 (post-launch):
  □ Affiliate link health check cron
  □ GDPR auto-deletion flow
  □ All edge cases E1-E10
  □ Duplicate registration prevention
  □ Support escalation routing

Month 2:
  □ Full support analytics dashboard
  □ Common issue trending
  □ AI improvement from real conversations
```
