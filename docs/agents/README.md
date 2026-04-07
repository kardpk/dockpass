# DockPass Agent Documents
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
