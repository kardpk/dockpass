# BoatCheckin — Infrastructure Setup
# @INFRA_SETUP
# Create every service account in this exact order
# Each step gives you credentials for .env.local

---

## BEFORE YOU START

Have these ready:
- Oakmont Logic LLC EIN number
- Wyoming LLC formation documents
- Mercury Bank account (or US bank)
- boatcheckin.com domain in Cloudflare
- Your personal email (not dockpass email yet)

---

## STEP 1 — Email First (everything needs email)

**Google Workspace or Zoho Mail**

```
Create: admin@boatcheckin.com
        hello@boatcheckin.com
        security@boatcheckin.com
        privacy@boatcheckin.com

Zoho Mail (free for 1 user):
  zoho.com/mail → Free plan
  Add domain: boatcheckin.com
  Verify via Cloudflare DNS TXT record

OR Google Workspace ($6/mo):
  workspace.google.com
  Better for calendar + docs integration

Use admin@boatcheckin.com for ALL service signups
```

---

## STEP 2 — GitHub Repository

```
1. Go to github.com
2. New repository:
   Name: dockpass
   Visibility: Private
   No readme (you have one)
   No .gitignore (you have one)

3. After creating:
   git remote add origin https://github.com/
   YOUR_USERNAME/dockpass.git

4. Enable security features:
   Settings → Security → Enable:
   ✓ Dependabot alerts
   ✓ Dependabot security updates
   ✓ Secret scanning
   ✓ Code scanning (CodeQL)

5. Branch protection for main:
   Settings → Branches → Add rule
   Branch name: main
   ✓ Require a pull request before merging
   ✓ Require status checks to pass
   ✓ Do not allow bypassing above settings
```

---

## STEP 3 — Supabase

```
1. Go to supabase.com
2. New project:
   Organization: Create "Oakmont Logic"
   Name: dockpass-production
   Database password: [generate strong, save to 1Password]
   Region: US East (N. Virginia) for Miami launch
   
3. After project created:
   Go to: Settings → API
   Copy to .env.local:
     NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
     SUPABASE_SERVICE_ROLE_KEY=[service role key]

4. Enable connection pooling:
   Settings → Database → Connection Pooling
   ✓ Enable pooling
   Mode: Transaction
   Copy pooled connection string separately

5. Create storage bucket:
   Storage → New bucket
   Name: boat-photos
   ✓ Public bucket (for captain photos)
   File size limit: 5MB
   Allowed MIME types: image/jpeg,image/png,image/webp

6. Email auth settings:
   Authentication → Providers → Email
   ✓ Enable email provider
   ✓ Confirm email (DISABLE for MVP — friction)
   
   Authentication → URL Configuration
   Site URL: https://boatcheckin.com
   Redirect URLs: https://boatcheckin.com/auth/callback

7. Create second project for staging:
   Name: dockpass-staging
   Same region
   Copy staging credentials separately
```

---

## STEP 4 — Upstash Redis

```
1. Go to upstash.com
2. Create account with admin@boatcheckin.com
3. Create database:
   Name: dockpass-redis
   Type: Regional
   Region: US-East-1 (closest to Vercel + Supabase)
   ✓ Enable Eviction (LRU policy)
   Max Memory: 256MB (free tier sufficient for MVP)

4. After creation:
   Copy to .env.local:
     UPSTASH_REDIS_URL=https://[endpoint].upstash.io
     UPSTASH_REDIS_TOKEN=[token]

5. Create second database for staging:
   Name: dockpass-redis-staging
   
6. Note: Render worker uses a DIFFERENT Redis
   (ioredis format, not Upstash)
   Render provides this when you create the Redis service
```

---

## STEP 5 — Vercel

```
1. Go to vercel.com
2. Sign up with GitHub account
3. Import project:
   New Project → Import Git Repository
   Select: dockpass
   Framework: Next.js (auto-detected)
   Root directory: apps/web
   
4. Environment variables:
   Add ALL variables from .env.local
   Set for: Production + Preview + Development
   
5. Domain setup:
   Settings → Domains
   Add: boatcheckin.com
   Add: www.boatcheckin.com
   Follow DNS instructions (add to Cloudflare)

6. Important settings:
   Settings → General
   Node.js version: 20.x
   
   Settings → Functions
   Max duration: 30s (for PDF generation)
   
   Settings → Security
   ✓ Enable DDoS protection
   ✓ Enable Bot protection

7. After first deploy:
   Note the deployment URL for testing
```

---

## STEP 6 — Render (Worker + Cron)

```
1. Go to render.com
2. New → Web Service:
   Name: dockpass-worker
   Repository: dockpass
   Branch: main
   Root directory: apps/worker
   Runtime: Node
   Build command: npm install && npm run build
   Start command: node dist/index.js
   Instance type: Starter ($7/month)
   
3. Add Redis on Render:
   New → Redis
   Name: dockpass-worker-redis
   Plan: Starter
   Copy connection URL to REDIS_URL env var
   
4. Add environment variables to worker:
   (same as Vercel but Redis URL is different)
   REDIS_URL=[render redis url]
   SUPABASE_SERVICE_ROLE_KEY=[same as web]
   RESEND_API_KEY=[same as web]
   TWILIO_ACCOUNT_SID=[same as web]
   TWILIO_AUTH_TOKEN=[same as web]
   
5. Cron jobs:
   New → Cron Job
   Name: dockpass-hourly
   Schedule: 0 * * * *
   Command: node dist/cron/hourly.js
   
   New → Cron Job
   Name: dockpass-daily
   Schedule: 0 6 * * *
   Command: node dist/cron/daily.js

6. Health check:
   Settings → Health Check Path: /health
```

---

## STEP 7 — Stripe Connect

```
1. Go to stripe.com
2. Create account:
   Business type: Company
   Business name: Oakmont Logic LLC
   Country: United States
   EIN: [your EIN]
   
3. Enable Connect:
   Dashboard → Connect → Get started
   Platform type: Software platform
   Use case: Booking and scheduling
   ✓ Enable Express accounts
   
4. Get keys:
   Developers → API keys
   Copy to .env.local:
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
     STRIPE_SECRET_KEY=sk_live_...
   
5. Create webhook:
   Developers → Webhooks → Add endpoint
   URL: https://boatcheckin.com/api/webhooks/stripe
   Events to listen:
     ✓ checkout.session.completed
     ✓ customer.subscription.created
     ✓ customer.subscription.updated
     ✓ customer.subscription.deleted
     ✓ invoice.payment_failed
     ✓ invoice.paid
     ✓ account.updated (for Connect accounts)
   Copy webhook signing secret:
     STRIPE_WEBHOOK_SECRET=whsec_...
   
6. Create products (do this carefully):
   Products → Add product for each tier:
   
   Product: BoatCheckin Solo
     Price 1: $49/month recurring
       ID: copy as STRIPE_PRICE_SOLO_MONTHLY
     Price 2: $468/year recurring (=$39/mo)
       ID: copy as STRIPE_PRICE_SOLO_ANNUAL
   
   Product: BoatCheckin Captain
     Price 1: $89/month
     Price 2: $852/year
   
   Product: BoatCheckin Fleet
     Price 1: $179/month
     Price 2: $1716/year
   
   Product: BoatCheckin Marina
     Price 1: $349/month
     Price 2: $3348/year

7. Test mode first:
   Keep test mode ON until product is launched
   Use test card: 4242 4242 4242 4242
   Switch to live AFTER first real operator pays
   
8. Get Connect client ID:
   Settings → Connect settings
   Copy client_id as STRIPE_CONNECT_CLIENT_ID
```

---

## STEP 8 — Resend (Email)

```
1. Go to resend.com
2. Create account with admin@boatcheckin.com
3. Add domain:
   Domains → Add domain
   Enter: boatcheckin.com
   Add DNS records to Cloudflare (shown in UI)
   Wait for verification (5-10 min)

4. Get API key:
   API Keys → Create API key
   Name: dockpass-production
   Permission: Full access
   Copy: RESEND_API_KEY=re_...

5. Create second key for staging:
   Name: dockpass-staging
   
6. Set from addresses:
   hello@boatcheckin.com (guest emails)
   admin@boatcheckin.com (operator emails)
   no-reply@boatcheckin.com (automated)
```

---

## STEP 9 — Twilio (Automated SMS)

```
1. Go to twilio.com
2. Create account
3. Verify your phone number
4. Get trial number (free to start):
   Phone Numbers → Buy a number
   Country: US
   Capabilities: ✓ SMS
   Choose a number (doesn't matter which)

5. Copy to .env.local:
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=[from console]
   TWILIO_FROM_NUMBER=+1[your number]

6. Upgrade from trial when live:
   Trial mode limits to verified numbers
   Add $20 credit to send to anyone
```

---

## STEP 10 — Mapbox

```
1. Go to mapbox.com
2. Create account with admin@boatcheckin.com
3. Get default public token OR create restricted one:
   Tokens → Create a token
   Name: dockpass-production
   Token scopes: ✓ styles:read ✓ tiles:read
   Allowed URLs:
     https://boatcheckin.com
     https://www.boatcheckin.com
     http://localhost:3000
   Copy: NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
   
4. Free tier includes 50,000 map loads/month
   Sufficient until 1,000+ operators
   No credit card required until overage
```

---

## STEP 11 — Cloudflare (DNS + Turnstile)

```
1. Go to cloudflare.com (you may already have account)
2. Add site: boatcheckin.com
   Change nameservers at your registrar to Cloudflare
   
3. DNS records needed:
   A record or CNAME for @ → Vercel
   CNAME for www → Vercel
   MX records for email (from Zoho/Google)
   TXT records for Resend domain verification
   
4. Security settings:
   SSL/TLS → Full (strict)
   ✓ Always use HTTPS
   ✓ HSTS (max-age=31536000)
   Security → ✓ Bot Fight Mode (free)
   Security level: Medium
   
5. Create Turnstile widget:
   Cloudflare Dashboard → Turnstile → Add site
   Site name: BoatCheckin Guest Check-in
   Domain: boatcheckin.com
   Widget type: Invisible
   Copy to .env.local:
     NEXT_PUBLIC_TURNSTILE_SITE_KEY=[site key]
     TURNSTILE_SECRET_KEY=[secret key]
   Both FREE — no billing required
```

---

## STEP 12 — Generate Security Secrets

```bash
# Run these in your terminal
# Copy each output to .env.local

# QR HMAC secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → QR_HMAC_SECRET=

# Trip link secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → TRIP_LINK_SECRET=

# VAPID keys for push notifications
cd apps/web
npx web-push generate-vapid-keys
# → NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# → VAPID_PRIVATE_KEY=

# IMPORTANT:
# Each of these must be DIFFERENT random strings
# Never reuse the same secret for different purposes
# Never commit these to git
# Store securely in 1Password or similar
```

---

## STEP 13 — Apply for Revenue APIs

```
BUOY API (per-trip insurance):
  Website: buoy.insure
  Email: partnerships@buoy.insure
  What to say:
    "We're building BoatCheckin (boatcheckin.com),
     a charter guest experience platform.
     We'd like to integrate Buoy for automatic
     per-trip policy activation on Florida
     charter boats. Using Oakmont Logic LLC,
     Wyoming. EIN: [your EIN]"
  Timeline: 2-4 weeks for API access
  → Build the product first, integrate when approved

TINT.AI (BoatCheckin Guarantees):
  Website: tint.ai
  Contact: partners@tint.ai
  Same message, different angle:
    "We want to offer 'BoatCheckin Guarantees' —
     embedded trip protection for charter guests."
  Timeline: 2-6 weeks
  → Non-blocking, phase 2 revenue

BOATUS AFFILIATE:
  Website: boatus.com/affiliate-program
  Very easy approval — just a URL affiliate
  Login with admin@boatcheckin.com
  Get affiliate tracking URL immediately
  → BOATUS_AFFILIATE_URL=[your affiliate link]
```

---

## FINAL .env.local Template

```bash
# Copy this entire block, fill in values, save as .env.local
# NEVER commit this file

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# REDIS (Upstash — for Next.js/Vercel)
UPSTASH_REDIS_URL=https://[endpoint].upstash.io
UPSTASH_REDIS_TOKEN=...

# REDIS (Render — for BullMQ worker)
REDIS_URL=redis://...

# STRIPE CONNECT
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# STRIPE PRICE IDs
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_CAPTAIN_MONTHLY=price_...
STRIPE_PRICE_CAPTAIN_ANNUAL=price_...
STRIPE_PRICE_FLEET_MONTHLY=price_...
STRIPE_PRICE_FLEET_ANNUAL=price_...
STRIPE_PRICE_MARINA_MONTHLY=price_...
STRIPE_PRICE_MARINA_ANNUAL=price_...

# EMAIL (Resend)
RESEND_API_KEY=re_...

# SMS (Twilio — automated only)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# MAPS (Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# BOT PROTECTION (Cloudflare Turnstile — free)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# PUSH NOTIFICATIONS (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# REVENUE APIs
BUOY_API_KEY=            # pending approval
BUOY_API_URL=https://api.buoy.insure
TINT_API_KEY=            # pending approval
TINT_API_URL=
BOATUS_AFFILIATE_URL=https://www.boatus.com/?ref=...

# SECURITY SECRETS (generate with crypto.randomBytes)
QR_HMAC_SECRET=          # 64 hex chars
TRIP_LINK_SECRET=        # 64 hex chars

# SCRAPING
APIFY_API_TOKEN=...

# OPENPHONE (business phone — not automated)
OPENPHONE_API_KEY=
OPENPHONE_NUMBER=+1786...

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```
