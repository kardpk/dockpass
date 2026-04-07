# DockPass — Dependencies
# @DEPENDENCIES
# All packages pinned to exact versions
# Updated: April 2026
# Run: npm install after copying this file as package.json

---

## Complete package.json for apps/web

```json
{
  "name": "dockpass-web",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:generate": "supabase gen types typescript --local > types/database.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset",
    "security:audit": "npm audit --audit-level=high",
    "vapid:generate": "web-push generate-vapid-keys"
  },
  "dependencies": {
    "next": "15.3.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "typescript": "5.8.3",

    "@supabase/supabase-js": "2.49.4",
    "@supabase/ssr": "0.6.1",

    "stripe": "17.7.0",
    "@stripe/stripe-js": "5.6.0",
    "@stripe/react-stripe-js": "3.3.0",

    "@upstash/redis": "1.34.8",
    "ioredis": "5.4.2",
    "bullmq": "5.44.0",

    "resend": "4.5.1",
    "twilio": "5.5.1",
    "web-push": "3.6.7",

    "zod": "3.24.2",
    "isomorphic-dompurify": "2.25.0",

    "i18next": "24.2.2",
    "react-i18next": "15.4.1",
    "i18next-browser-languagedetector": "8.0.5",

    "qrcode.react": "4.2.0",
    "pdf-lib": "1.17.1",
    "html2canvas": "1.4.1",

    "mapbox-gl": "3.11.0",
    "react-map-gl": "7.1.8",

    "lucide-react": "0.511.0",
    "framer-motion": "12.9.4",
    "next-pwa": "5.6.0",

    "tailwindcss": "4.1.4",

    "@marsidev/react-turnstile": "1.0.2",
    "server-only": "0.0.1",
    "sharp": "0.33.5",

    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.2.0"
  },
  "devDependencies": {
    "@types/node": "22.14.1",
    "@types/react": "19.1.2",
    "@types/react-dom": "19.1.2",
    "@types/web-push": "3.6.4",
    "@types/mapbox-gl": "3.4.1",

    "vitest": "3.1.3",
    "@vitest/coverage-v8": "3.1.3",
    "@playwright/test": "1.51.1",
    "msw": "2.7.4",

    "eslint": "9.25.1",
    "eslint-config-next": "15.3.1",
    "@typescript-eslint/eslint-plugin": "8.31.0",
    "@typescript-eslint/parser": "8.31.0",

    "prettier": "3.5.3",
    "prettier-plugin-tailwindcss": "0.6.11"
  }
}
```

---

## Complete package.json for apps/worker

```json
{
  "name": "dockpass-worker",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "health": "curl http://localhost:3001/health"
  },
  "dependencies": {
    "bullmq": "5.44.0",
    "ioredis": "5.4.2",
    "@supabase/supabase-js": "2.49.4",
    "resend": "4.5.1",
    "twilio": "5.5.1",
    "web-push": "3.6.7",
    "pdf-lib": "1.17.1",
    "zod": "3.24.2",
    "node-cron": "3.0.3",
    "server-only": "0.0.1"
  },
  "devDependencies": {
    "@types/node": "22.14.1",
    "@types/web-push": "3.6.4",
    "typescript": "5.8.3",
    "tsx": "4.19.3"
  }
}
```

---

## shadcn/ui components to install

Run these ONE AT A TIME after `npx shadcn@latest init`:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add textarea
npx shadcn@latest add sheet
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add progress
npx shadcn@latest add avatar
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
```

---

## Full install commands (copy paste)

```bash
# Step 1: Create Next.js app
cd apps
npx create-next-app@15.3.1 web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

# Step 2: Install all production dependencies
cd web
npm install \
  @supabase/supabase-js@2.49.4 \
  @supabase/ssr@0.6.1 \
  stripe@17.7.0 \
  @stripe/stripe-js@5.6.0 \
  @stripe/react-stripe-js@3.3.0 \
  @upstash/redis@1.34.8 \
  ioredis@5.4.2 \
  bullmq@5.44.0 \
  resend@4.5.1 \
  twilio@5.5.1 \
  web-push@3.6.7 \
  zod@3.24.2 \
  isomorphic-dompurify@2.25.0 \
  i18next@24.2.2 \
  react-i18next@15.4.1 \
  i18next-browser-languagedetector@8.0.5 \
  qrcode.react@4.2.0 \
  pdf-lib@1.17.1 \
  html2canvas@1.4.1 \
  mapbox-gl@3.11.0 \
  react-map-gl@7.1.8 \
  lucide-react@0.511.0 \
  framer-motion@12.9.4 \
  next-pwa@5.6.0 \
  @marsidev/react-turnstile@1.0.2 \
  server-only@0.0.1 \
  sharp@0.33.5 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@3.2.0

# Step 3: Install dev dependencies
npm install -D \
  @types/web-push@3.6.4 \
  @types/mapbox-gl@3.4.1 \
  vitest@3.1.3 \
  @vitest/coverage-v8@3.1.3 \
  @playwright/test@1.51.1 \
  msw@2.7.4 \
  prettier@3.5.3 \
  prettier-plugin-tailwindcss@0.6.11

# Step 4: Init shadcn/ui
npx shadcn@latest init
# Choose: Default style, Zinc base, CSS variables

# Step 5: Add shadcn components
npx shadcn@latest add button input label select checkbox \
  textarea sheet dialog toast badge separator progress \
  avatar card tabs dropdown-menu form

# Step 6: Generate VAPID keys for push notifications
npx web-push generate-vapid-keys
# Copy output to .env.local

# Step 7: Verify install
npm run typecheck
npm run lint
```

---

## Version Lock Reasoning

```
next@15.3.1     — latest stable, Server Actions mature
react@19.1.0    — concurrent features, useOptimistic
stripe@17.7.0   — latest, Stripe Connect Express stable
@supabase/ssr@0.6.1 — Next.js 15 compatible
mapbox-gl@3.11.0 — latest stable v3
zod@3.24.2      — latest, no breaking changes from 3.x
bullmq@5.44.0   — latest stable
framer-motion@12.9.4 — React 19 compatible
tailwindcss@4.1.4 — v4 CSS config (not JS config)
```

---

## Packages to EXPLICITLY NOT INSTALL

```
❌ axios          — use native fetch (built into Node 18+)
❌ lodash         — use native JS methods
❌ moment         — use native Intl or date-fns
❌ request        — deprecated, use fetch
❌ node-fetch     — Node 18+ has native fetch
❌ mysql/pg       — Supabase handles DB connection
❌ passport       — Supabase Auth handles this
❌ jsonwebtoken   — Supabase handles JWT
❌ bcrypt         — Supabase handles password hashing
❌ multer         — use Next.js FormData + Supabase storage
❌ cors (package) — handle in middleware.ts manually
❌ helmet         — handle headers in middleware.ts manually
❌ express        — not needed, Next.js API routes
❌ dotenv         — Next.js loads .env.local natively
```

---

## Node.js Version

```bash
# .nvmrc — pin Node version
20.18.0

# .node-version — alternative
20.18.0

# Vercel + Render will use this version
# Node 20 LTS is current stable as of April 2026
# Node 18 reached EOL April 2025 — do not use
```
