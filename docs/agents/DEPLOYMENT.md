# BoatCheckin — Deployment Agent
# @DEPLOYMENT

## Role
You own CI/CD pipelines, environment configuration,
deployment to Vercel and Render, and the GitHub
repository structure. Zero-downtime deployments.
Secrets never in code.

---

## Infrastructure Map

```
GitHub (source)
    ↓ push to main
    ├── Vercel (auto-deploy web app)
    │     URL: boatcheckin.com
    │     Preview: every PR gets preview URL
    │
    └── Render (auto-deploy worker + cron)
          Worker: dockpass-worker.onrender.com
          Cron: dockpass-cron.onrender.com

Database:  Supabase (managed PostgreSQL)
Cache:     Upstash Redis (Vercel) + Render Redis
Email:     Resend
SMS:       Twilio
Payments:  Stripe
Domain:    Cloudflare (DNS + DDoS)
```

---

## Repository Structure

```
github.com/oakmontlogic/dockpass (private)

Branch strategy:
  main      → production (auto-deploys)
  develop   → staging
  feature/* → PR → develop → main

Protection rules on main:
  ✓ Require PR review
  ✓ Require status checks (tests must pass)
  ✓ No direct push
  ✓ No force push
```

---

## GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: TypeScript check
        run: npx tsc --noEmit
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npx vitest run --coverage
      
      - name: Check coverage thresholds
        run: npx vitest run --coverage --reporter=json
      
      # E2E only on PRs to main
      - name: E2E tests
        if: github.base_ref == 'main'
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          
      - name: Dependency audit
        run: npm audit --audit-level=high
```

---

## Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/trip/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, s-maxage=60, stale-while-revalidate=300" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/t/:slug", "destination": "/trip/:slug" }
  ]
}
```

### Vercel Environment Variables

```
Production environment in Vercel dashboard:
(Settings → Environment Variables → Production only)

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
QR_HMAC_SECRET
TRIP_LINK_SECRET
NEXT_PUBLIC_APP_URL=https://boatcheckin.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY
APIFY_API_TOKEN
```

---

## Render Configuration

```yaml
# render.yaml
services:
  # Background worker
  - type: worker
    name: dockpass-worker
    runtime: node
    buildCommand: npm install && npm run build:worker
    startCommand: node dist/worker/index.js
    envVars:
      - key: REDIS_URL
        fromService:
          type: redis
          name: dockpass-redis
          property: connectionString
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: TWILIO_ACCOUNT_SID
        sync: false
      - key: TWILIO_AUTH_TOKEN
        sync: false

  # Hourly cron
  - type: cron
    name: dockpass-hourly
    runtime: node
    schedule: "0 * * * *"
    buildCommand: npm install && npm run build:worker
    startCommand: node dist/worker/cron/hourly.js
    
  # Daily cron
  - type: cron
    name: dockpass-daily
    runtime: node
    schedule: "0 6 * * *"
    startCommand: node dist/worker/cron/daily.js

databases:
  - type: redis
    name: dockpass-redis
    plan: starter
```

---

## Domain + Cloudflare Setup

```
1. Register boatcheckin.com (Namecheap or Porkbun)
2. Add to Cloudflare (free plan)
3. Update nameservers to Cloudflare
4. In Cloudflare:
   - Add CNAME: @ → cname.vercel-dns.com (proxied)
   - Add CNAME: www → cname.vercel-dns.com (proxied)
   - Enable Always Use HTTPS
   - Enable HSTS
   - Set SSL/TLS to Full (Strict)
   - Enable Bot Fight Mode (free)
   - Set security level: Medium

5. In Vercel:
   - Add custom domain: boatcheckin.com
   - Add custom domain: www.boatcheckin.com
   - Verify via Cloudflare DNS
```

---

## Supabase Production Setup

```
1. Create new project on supabase.com
2. Select region:
   - US operators only: US East (N. Virginia)
   - EU operators: EU West (Ireland)

3. Run migrations:
   npx supabase db push

4. Enable Row Level Security on all tables

5. Set up auth:
   - Email + password enabled
   - Email confirmation required
   - JWT expiry: 3600 (1 hour)
   - Refresh token rotation: enabled

6. Storage:
   Create bucket: boat-photos
   Policy: public read, authenticated write
   Max file size: 5MB
   Allowed MIME types: image/jpeg, image/png, image/webp

7. Get connection strings:
   - API URL → NEXT_PUBLIC_SUPABASE_URL
   - anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service role key → SUPABASE_SERVICE_ROLE_KEY
```

---

## Launch Checklist

```
Infrastructure:
□ boatcheckin.com domain registered
□ Cloudflare configured with DDoS protection
□ Vercel project created + domain connected
□ Render worker + cron deployed
□ Supabase project created + migrations run
□ Upstash Redis created
□ Render Redis created

Stripe:
□ Stripe account created (Oakmont Logic LLC)
□ Products + prices created for all 4 tiers
□ Webhook endpoint registered (boatcheckin.com/api/webhooks/stripe)
□ Test mode verified end-to-end

Email/SMS:
□ Resend domain verified (boatcheckin.com)
□ Twilio number purchased
□ Email templates tested

Security:
□ All environment variables set in Vercel
□ All environment variables set in Render
□ .env not in git (check .gitignore)
□ GitHub secret scanning enabled
□ RLS policies tested on all tables
□ Rate limiting tested
□ QR signing tested

Legal:
□ Privacy Policy live at boatcheckin.com/privacy
□ Terms of Service live at boatcheckin.com/terms
□ Cookie banner for EU users
□ GDPR deletion endpoint working

Testing:
□ All unit tests passing
□ E2E guest flow tested on real mobile device
□ E2E operator flow tested
□ Stripe test payment end-to-end
□ PDF manifest downloaded and reviewed
□ Postcard generated and downloaded
□ PWA install tested on iOS + Android

Performance:
□ Lighthouse score > 90 on trip page
□ Trip page loads < 2s on 4G
□ Weather widget loads without blocking page
```

---

## Post-Launch Monitoring

```
Daily:
  Check Vercel deployment health
  Check Render worker health
  Check Supabase connection pool

Weekly:
  Review Stripe failed payments
  Review Resend bounce rate
  Check Redis memory usage
  Review any error logs

Monthly:
  Dependency security audit (npm audit)
  Review Cloudflare analytics
  Check Supabase storage usage
  Review and rotate secrets if needed
```
