#!/bin/bash

# BoatCheckin — Agent Setup Script
# Updated: April 2026 — v2 (CTO Blueprint)
# Run from your project root:
# chmod +x setup-agents.sh && ./setup-agents.sh

echo "⚓ Setting up BoatCheckin agent structure..."

# ============================================
# ROOT PROJECT STRUCTURE
# ============================================

mkdir -p docs/agents

mkdir -p apps/web/app/\(public\)/trip/\[slug\]
mkdir -p apps/web/app/\(public\)/snapshot/\[token\]
mkdir -p apps/web/app/\(auth\)/login
mkdir -p apps/web/app/\(auth\)/signup
mkdir -p apps/web/app/dashboard/trips
mkdir -p apps/web/app/dashboard/boats
mkdir -p apps/web/app/dashboard/guests
mkdir -p apps/web/app/dashboard/revenue
mkdir -p apps/web/app/dashboard/reviews
mkdir -p apps/web/app/dashboard/settings
mkdir -p apps/web/app/dashboard/billing

mkdir -p apps/web/app/api/trips/\[slug\]
mkdir -p apps/web/app/api/dashboard/trips
mkdir -p apps/web/app/api/dashboard/boats
mkdir -p apps/web/app/api/dashboard/guests
mkdir -p apps/web/app/api/dashboard/manifest
mkdir -p apps/web/app/api/weather/\[lat\]/\[lng\]/\[date\]
mkdir -p apps/web/app/api/webhooks/stripe
mkdir -p apps/web/app/api/billing
mkdir -p apps/web/app/api/support
mkdir -p apps/web/app/api/gdpr
mkdir -p apps/web/app/api/captain/\[token\]

mkdir -p apps/web/components/ui
mkdir -p apps/web/components/trip
mkdir -p apps/web/components/join
mkdir -p apps/web/components/dashboard
mkdir -p apps/web/components/shared

mkdir -p apps/web/lib/supabase
mkdir -p apps/web/lib/stripe
mkdir -p apps/web/lib/redis
mkdir -p apps/web/lib/security
mkdir -p apps/web/lib/pdf
mkdir -p apps/web/lib/qr
mkdir -p apps/web/lib/weather
mkdir -p apps/web/lib/i18n/locales
mkdir -p apps/web/lib/notifications
mkdir -p apps/web/lib/mapbox
mkdir -p apps/web/lib/buoy
mkdir -p apps/web/lib/tint
mkdir -p apps/web/lib/affiliates
mkdir -p apps/web/lib/config

mkdir -p apps/web/types
mkdir -p apps/web/hooks
mkdir -p apps/web/public/icons

mkdir -p apps/worker/queues
mkdir -p apps/worker/cron
mkdir -p apps/worker/jobs

mkdir -p packages/types
mkdir -p packages/utils

mkdir -p supabase/migrations

# ============================================
# .gitkeep for empty folders
# ============================================

for dir in \
  apps/web/components/ui \
  apps/web/components/trip \
  apps/web/components/join \
  apps/web/components/dashboard \
  apps/web/components/shared \
  apps/web/lib/supabase \
  apps/web/lib/stripe \
  apps/web/lib/redis \
  apps/web/lib/security \
  apps/web/lib/pdf \
  apps/web/lib/qr \
  apps/web/lib/weather \
  apps/web/lib/mapbox \
  apps/web/lib/buoy \
  apps/web/lib/tint \
  apps/web/lib/affiliates \
  apps/web/lib/notifications \
  apps/web/public/icons \
  apps/worker/queues \
  apps/worker/cron \
  apps/worker/jobs \
  supabase/migrations; do
  touch "$dir/.gitkeep"
done

# ============================================
# .gitignore
# ============================================

cat > .gitignore << 'EOF'
# Environment — NEVER commit
.env
.env.local
.env.production
.env.staging
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# PWA
public/sw.js
public/workbox-*.js
public/worker-*.js

# Testing
coverage/
playwright-report/
test-results/

# Misc
.DS_Store
*.pem
.vercel
*.log
npm-debug.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

# ============================================
# .env.local template
# ============================================

cat > .env.local.example << 'EOF'
# BoatCheckin Environment Variables
# Copy to .env.local — NEVER commit .env.local

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# REDIS (Upstash)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=

# STRIPE CONNECT
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_CONNECT_CLIENT_ID=ca_

# OPENPHONE (business phone — 786 Miami)
OPENPHONE_API_KEY=
OPENPHONE_NUMBER=+17861234567

# TWILIO (automated SMS only)
TWILIO_ACCOUNT_SID=AC
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1

# RESEND (email)
RESEND_API_KEY=re_

# MAPBOX
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1

# PUSH NOTIFICATIONS (VAPID)
# Generate: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# REVENUE APIs
BUOY_API_KEY=
BUOY_API_URL=https://api.buoy.insure
TINT_API_KEY=
TINT_API_URL=
BOATUS_AFFILIATE_URL=https://www.boatus.com

# SECURITY SECRETS
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
QR_HMAC_SECRET=
TRIP_LINK_SECRET=

# SCRAPING
APIFY_API_TOKEN=

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# ============================================
# Agent README
# ============================================

cat > docs/agents/README.md << 'EOF'
# BoatCheckin Agent Documents
# Updated: April 2026 — v2 CTO Blueprint

## Read Order (always start with MASTER)

  00-MASTER.md        Primary reference — read first always
  01-PRODUCT.md       Product definition
  02-ARCHITECTURE.md  System design + stack
  03-DATABASE.md      Supabase schema + RLS
  04-SECURITY.md      Security implementations
  05-FRONTEND.md      Next.js 15 + React 19 + shadcn
  06-DESIGN.md        Design system
  07-BACKEND.md       API routes + workers
  08-PAYMENTS.md      Stripe Connect + Buoy + Tint.ai
  09-NOTIFICATIONS.md OpenPhone + Twilio + Resend
  10-COMPLIANCE.md    GDPR + FL Livery Law
  11-REDIS.md         Caching + BullMQ
  12-TESTING.md       Tests + coverage
  13-DEPLOYMENT.md    CI/CD + launch
  14-HOWTO.md         Step-by-step build guide
  15-AUTOMATION.md    Self-serve support system

## Usage in Cursor / Windsurf / Antigravity

  @MASTER @SECURITY @BACKEND
  Build the guest registration endpoint

  @MASTER @DESIGN @FRONTEND
  Build the weather widget component

  @MASTER @DATABASE @SECURITY
  Add push subscriptions table

  @MASTER @PAYMENTS
  Build Stripe Connect operator onboarding

  @MASTER @COMPLIANCE @BACKEND
  Integrate Buoy API for trip insurance

## Stack Summary

  Frontend:   Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
  Database:   Supabase (PostgreSQL 15+) + Upstash Redis
  Maps:       Mapbox GL JS v3+
  Payments:   Stripe Connect
  Phone:      OpenPhone (786 Miami area code)
  Insurance:  Buoy API + Tint.ai + Novamar
  Affiliates: BoatUS ($30/captain) + Boat-Ed
  Workers:    Render + BullMQ
  Hosting:    Vercel + Render
  Legal:      Oakmont Logic LLC (Wyoming)
  Address:    Northwest Agents, St. Petersburg FL
EOF

echo ""
echo "✅ BoatCheckin v2 structure created"
echo ""
echo "📁 Folder tree:"
find . -type d | grep -v node_modules | grep -v .git | grep -v .next | sort | sed 's|[^/]*/|  |g'
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Rename agent .md files with numbers:"
echo "     MASTER.md        → docs/agents/00-MASTER.md"
echo "     PRODUCT.md       → docs/agents/01-PRODUCT.md"
echo "     ARCHITECTURE.md  → docs/agents/02-ARCHITECTURE.md"
echo "     DATABASE.md      → docs/agents/03-DATABASE.md"
echo "     SECURITY.md      → docs/agents/04-SECURITY.md"
echo "     FRONTEND.md      → docs/agents/05-FRONTEND.md"
echo "     DESIGN.md        → docs/agents/06-DESIGN.md"
echo "     BACKEND.md       → docs/agents/07-BACKEND.md"
echo "     PAYMENTS.md      → docs/agents/08-PAYMENTS.md"
echo "     NOTIFICATIONS.md → docs/agents/09-NOTIFICATIONS.md"
echo "     COMPLIANCE.md    → docs/agents/10-COMPLIANCE.md"
echo "     REDIS.md         → docs/agents/11-REDIS.md"
echo "     TESTING.md       → docs/agents/12-TESTING.md"
echo "     DEPLOYMENT.md    → docs/agents/13-DEPLOYMENT.md"
echo "     HOWTO.md         → docs/agents/14-HOWTO.md"
echo "     AUTOMATION.md    → docs/agents/15-AUTOMATION.md"
echo ""
echo "  2. Copy .env.local.example to .env.local and fill in values"
echo "  3. Run: npm install"
echo "  4. Open in Cursor/Windsurf and use @ to reference agents"
echo ""
echo "⚓ BoatCheckin v2 is ready to build."

# ============================================
# ROOT PROJECT STRUCTURE
# ============================================

mkdir -p docs/agents
mkdir -p docs/assets

mkdir -p apps/web/app/\(public\)/trip/\[slug\]
mkdir -p apps/web/app/\(public\)/snapshot/\[token\]
mkdir -p apps/web/app/\(auth\)/login
mkdir -p apps/web/app/\(auth\)/signup
mkdir -p apps/web/app/dashboard/trips
mkdir -p apps/web/app/dashboard/boats
mkdir -p apps/web/app/dashboard/guests
mkdir -p apps/web/app/dashboard/revenue
mkdir -p apps/web/app/dashboard/reviews
mkdir -p apps/web/app/dashboard/settings
mkdir -p apps/web/app/dashboard/billing

mkdir -p apps/web/app/api/trips/\[slug\]
mkdir -p apps/web/app/api/dashboard/trips
mkdir -p apps/web/app/api/dashboard/boats
mkdir -p apps/web/app/api/dashboard/guests
mkdir -p apps/web/app/api/dashboard/manifest
mkdir -p apps/web/app/api/weather/\[lat\]/\[lng\]/\[date\]
mkdir -p apps/web/app/api/webhooks/stripe
mkdir -p apps/web/app/api/billing
mkdir -p apps/web/app/api/support
mkdir -p apps/web/app/api/gdpr
mkdir -p apps/web/app/api/captain/\[token\]

mkdir -p apps/web/components/ui
mkdir -p apps/web/components/trip
mkdir -p apps/web/components/join
mkdir -p apps/web/components/dashboard
mkdir -p apps/web/components/shared

mkdir -p apps/web/lib/supabase
mkdir -p apps/web/lib/stripe
mkdir -p apps/web/lib/redis
mkdir -p apps/web/lib/security
mkdir -p apps/web/lib/pdf
mkdir -p apps/web/lib/qr
mkdir -p apps/web/lib/weather
mkdir -p apps/web/lib/i18n/locales
mkdir -p apps/web/lib/notifications
mkdir -p apps/web/lib/config

mkdir -p apps/web/types
mkdir -p apps/web/hooks
mkdir -p apps/web/public/icons

mkdir -p apps/worker/queues
mkdir -p apps/worker/cron
mkdir -p apps/worker/jobs

mkdir -p packages/types
mkdir -p packages/utils

mkdir -p supabase/migrations

# ============================================
# CREATE PLACEHOLDER FILES
# ============================================

# .gitkeep files so empty folders are tracked
touch apps/web/components/ui/.gitkeep
touch apps/web/components/trip/.gitkeep
touch apps/web/components/join/.gitkeep
touch apps/web/components/dashboard/.gitkeep
touch apps/web/components/shared/.gitkeep
touch apps/web/lib/supabase/.gitkeep
touch apps/web/lib/stripe/.gitkeep
touch apps/web/lib/redis/.gitkeep
touch apps/web/lib/security/.gitkeep
touch apps/web/lib/pdf/.gitkeep
touch apps/web/lib/qr/.gitkeep
touch apps/web/lib/weather/.gitkeep
touch apps/web/lib/notifications/.gitkeep
touch apps/web/public/icons/.gitkeep
touch apps/worker/queues/.gitkeep
touch apps/worker/cron/.gitkeep
touch apps/worker/jobs/.gitkeep
touch supabase/migrations/.gitkeep

# ============================================
# CREATE .gitignore
# ============================================

cat > .gitignore << 'EOF'
# Environment variables — NEVER commit these
.env
.env.local
.env.production
.env.staging
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# PWA
public/sw.js
public/workbox-*.js
public/worker-*.js

# Testing
coverage/
playwright-report/
test-results/

# Misc
.DS_Store
*.pem
.vercel
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

# ============================================
# CREATE .env.local TEMPLATE
# ============================================

cat > .env.local.example << 'EOF'
# Copy this file to .env.local and fill in values
# NEVER commit .env.local to git

# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# REDIS (Upstash)
# ============================================
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token

# ============================================
# STRIPE
# ============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# ============================================
# EMAIL (Resend)
# ============================================
RESEND_API_KEY=re_

# ============================================
# SMS (Twilio)
# ============================================
TWILIO_ACCOUNT_SID=AC
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1

# ============================================
# PUSH NOTIFICATIONS (VAPID)
# ============================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# ============================================
# SECURITY SECRETS
# ============================================
QR_HMAC_SECRET=generate-32-random-bytes-here
TRIP_LINK_SECRET=generate-32-random-bytes-here

# ============================================
# SCRAPING
# ============================================
APIFY_API_TOKEN=

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# ============================================
# CREATE README IN AGENTS FOLDER
# ============================================

cat > docs/agents/README.md << 'EOF'
# BoatCheckin Agent Documents

## How to use in Antigravity IDE

Reference agents using @ command in terminal:

  @AGENTS        Master index — read first
  @PRODUCT       Product context
  @ARCHITECTURE  System design
  @DATABASE      Supabase schema + RLS
  @SECURITY      Security implementations
  @FRONTEND      React components + PWA
  @DESIGN        Design system
  @BACKEND       API routes + workers
  @PAYMENTS      Stripe integration
  @NOTIFICATIONS Email + SMS + push
  @COMPLIANCE    GDPR + maritime law
  @REDIS         Caching + queues
  @TESTING       Unit + E2E tests
  @DEPLOYMENT    CI/CD + launch
  @HOWTO         Step-by-step build guide
  @AUTOMATION    Automated support system

## Example usage

  @SECURITY @BACKEND
  Build the guest registration API route

  @DESIGN @FRONTEND
  Build the weather widget component

  @DATABASE @SECURITY
  Add push subscriptions table with RLS policies

## File placement

Place all .md files directly in this folder:
  docs/agents/AGENTS.md
  docs/agents/PRODUCT.md
  docs/agents/ARCHITECTURE.md
  docs/agents/DATABASE.md
  docs/agents/SECURITY.md
  docs/agents/FRONTEND.md
  docs/agents/DESIGN.md
  docs/agents/BACKEND.md
  docs/agents/PAYMENTS.md
  docs/agents/NOTIFICATIONS.md
  docs/agents/COMPLIANCE.md
  docs/agents/REDIS.md
  docs/agents/TESTING.md
  docs/agents/DEPLOYMENT.md
  docs/agents/HOWTO.md
  docs/agents/AUTOMATION.md
EOF

echo ""
echo "✅ Folder structure created successfully"
echo ""
echo "📁 Structure:"
echo ""
find . -type d | grep -v node_modules | grep -v .git | grep -v .next | sort | sed 's|[^/]*/|  |g'
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Copy all 16 agent .md files into:  docs/agents/"
echo "  2. Copy .env.local.example to:        .env.local"
echo "  3. Fill in all values in:             .env.local"
echo "  4. Run:                               npm install"
echo "  5. Open Antigravity IDE and use @ commands"
echo ""
echo "⚓ BoatCheckin is ready to build."
