# Agent Task — Fix Gaps Batch 2
**Gaps covered:** Duplicate Migrations · Captain Token Expiry · Boat CRUD API · Push Service Worker  
**Priority:** Execute in the exact order listed. Each task is self-contained. Do not skip or reorder.  
**Out of scope:** Email provider wiring (GAP 11) — handled separately tonight.

---

# TASK 1 — Rename Duplicate Migration Files
**Gap:** Two pairs of migrations share numbers (`003_*` and `004_*`). Supabase processes them alphabetically within the same prefix. This is fragile and will cause ordering confusion as new migrations are added.

---

## Pre-Task: Read Before Touching Anything

1. Run `ls supabase/migrations/` and record the exact current filenames. Do not proceed until you have confirmed exactly which files exist.
2. Read `supabase/config.toml` to understand if there is any migration lock file or explicit ordering configured.
3. **CRITICAL:** Check if Supabase's local migration history has already applied these files. Run `supabase migration list` if available. If migrations have already been applied to a remote/production database, renaming them is a destructive operation — the migration history table uses the filename as its key. In that case, follow the **Production-safe path** below instead of the rename path.

---

## Two Paths — Read Both, Choose One

### Path A — Local/Dev Only (files not yet applied to production Supabase)

Rename the four conflicting files to sequential numbers that continue cleanly after the last non-conflicting file. Based on the audit, the correct sequential rename is:

| Current filename | Rename to |
|---|---|
| `003_join_flow.sql` | `003_join_flow.sql` ← keep (first alphabetically, already correct) |
| `003_audit_additions.sql` | `007_audit_additions.sql` |
| `004_post_trip.sql` | `004_post_trip.sql` ← keep (first alphabetically, already correct) |
| `004_realtime_guests.sql` | `008_realtime_guests.sql` |

The existing files `005_realtime.sql` and `006_weather_alerts.sql` become `009_realtime.sql` and `010_weather_alerts.sql` respectively.

**Full final sequence after rename:**
```
001_initial_schema.sql
002_phase2_boat_types.sql
003_join_flow.sql
004_post_trip.sql
007_audit_additions.sql      ← was 003_audit_additions.sql
008_realtime_guests.sql      ← was 004_realtime_guests.sql
009_realtime.sql             ← was 005_realtime.sql
010_weather_alerts.sql       ← was 006_weather_alerts.sql
```

> **Why these numbers?** Gaps are intentional — they leave room for the two tasks in this batch that require new migrations (boat CRUD and captain token expiry) to insert naturally as `005_` and `006_`.

After renaming, run `supabase db reset` locally to confirm migrations apply in correct order with zero errors.

---

### Path B — Production-Safe (files already applied to remote Supabase)

Do NOT rename existing files. Supabase tracks applied migrations by filename in the `supabase_migrations.schema_migrations` table. Renaming an already-applied file would make Supabase think it is a new unapplied migration and attempt to re-run it on next deploy — causing duplicate object errors.

Instead:

1. Leave all existing filenames exactly as they are.
2. Create a new file `supabase/migrations/007_migration_housekeeping.sql` containing only a comment block that documents the known ordering:

```sql
-- Migration 007: Housekeeping documentation
-- =============================================
-- The following migration files were created with duplicate number prefixes
-- during rapid development. They are applied in the order Supabase processes
-- them (alphabetical within prefix). The effective order is documented here
-- for clarity. No schema changes in this file.
--
-- Effective application order:
--   001_initial_schema.sql
--   002_phase2_boat_types.sql
--   003_audit_additions.sql   (before 003_join_flow alphabetically)
--   003_join_flow.sql
--   004_post_trip.sql
--   004_realtime_guests.sql
--   005_realtime.sql
--   006_weather_alerts.sql
-- =============================================
```

3. From this point forward, new migrations use strictly sequential numbers starting from `008_`.

---

## Verification

```
□ Run supabase db reset locally — zero errors, zero warnings about duplicate objects
□ Run supabase migration list — all migrations show as Applied
□ Grep codebase for any hardcoded migration filenames — update if found
□ Confirm new migrations added in subsequent tasks (005_ and 006_) apply cleanly on top
```

---
---

# TASK 2 — Captain Token Expiry
**Gap:** Captain snapshot tokens are static strings with no TTL. A leaked captain URL provides permanent read access to trip data including the full guest list with emergency contacts, dietary restrictions, and approval status.

---

## Pre-Task: Read Before Touching Anything

1. Read `apps/web/lib/security/tokens.ts` in full — understand exactly how captain tokens are currently generated.
2. Read `apps/web/app/api/captain/[token]/route.ts` in full — understand the current validation path.
3. Read `apps/web/app/api/dashboard/trips/route.ts` (POST handler) — this is where captain tokens are assigned to trips on creation. You need to know the current field name on the `trips` table row.
4. Read `apps/web/app/snapshot/[token]/page.tsx` — understand what the captain snapshot page fetches and renders so the token refresh flow does not break it.
5. Read `apps/web/components/captain/CaptainSnapshotView.tsx` — confirm it reads token from URL params.
6. Check `apps/web/lib/supabase/service.ts` to confirm the service role client import path used in API routes.

---

## Schema Change: New Migration

Create `supabase/migrations/005_captain_token_expiry.sql`:

```sql
-- Migration 005: Captain token expiry
-- Adds expiry tracking to trips so captain snapshot tokens can be time-bounded.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS captain_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captain_token_version     INT NOT NULL DEFAULT 1;

-- Index for token lookup — captain snapshot API does a WHERE on captain_token
CREATE INDEX IF NOT EXISTS trips_captain_token_idx
  ON trips (captain_token)
  WHERE captain_token IS NOT NULL;

-- Comment documenting the token lifecycle
COMMENT ON COLUMN trips.captain_token_expires_at IS
  'UTC timestamp after which the captain_token is invalid. NULL = legacy token (treat as expired and regenerate).';

COMMENT ON COLUMN trips.captain_token_version IS
  'Monotonically incrementing counter. Incrementing this value invalidates all previously issued tokens for this trip without changing the token string — used for immediate revocation.';
```

> **Do not** add `NOT NULL` to `captain_token_expires_at`. Existing rows will have `NULL`, which the API will treat as expired (forcing regeneration on next captain access).

---

## Token Generation: Update `lib/security/tokens.ts`

Find the existing `generateCaptainToken` function (or the equivalent — read the file first to confirm the exact name). Replace its implementation with the following:

```typescript
import { randomBytes, createHmac, timingSafeEqual } from 'crypto'

// Token TTL: 72 hours from issuance
// Rationale: covers trip day + reasonable pre-trip prep window
// Operators can regenerate at any time from the dashboard
const CAPTAIN_TOKEN_TTL_HOURS = 72

export interface CaptainTokenPayload {
  tripId: string
  version: number
  issuedAt: number   // Unix ms
  expiresAt: number  // Unix ms
}

export function generateCaptainToken(
  tripId: string,
  version: number
): { token: string; expiresAt: Date } {
  const issuedAt = Date.now()
  const expiresAt = issuedAt + CAPTAIN_TOKEN_TTL_HOURS * 60 * 60 * 1000

  const payload: CaptainTokenPayload = { tripId, version, issuedAt, expiresAt }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const hmac = createHmac('sha256', process.env.CAPTAIN_TOKEN_SECRET!)
  hmac.update(payloadB64)
  const signature = hmac.digest('base64url')

  return {
    token: `${payloadB64}.${signature}`,
    expiresAt: new Date(expiresAt),
  }
}

export function verifyCaptainToken(token: string): CaptainTokenPayload | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    // Verify HMAC signature
    const hmac = createHmac('sha256', process.env.CAPTAIN_TOKEN_SECRET!)
    hmac.update(payloadB64)
    const expectedSig = hmac.digest('base64url')

    const sigBuf = Buffer.from(signature, 'base64url')
    const expectedBuf = Buffer.from(expectedSig, 'base64url')
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null

    // Decode payload
    const payload: CaptainTokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    )

    // Check expiry
    if (Date.now() > payload.expiresAt) return null

    return payload
  } catch {
    return null
  }
}
```

**Add to `.env.local` and to Vercel/Render environment variables:**
```
CAPTAIN_TOKEN_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

---

## API Route: Update Captain Token Validation

Open `apps/web/app/api/captain/[token]/route.ts`. Replace the current validation logic with the following pattern. Read the file first — adapt to the existing response shape, do not change what the route returns, only change how it validates:

```typescript
import { verifyCaptainToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  // 1. Verify HMAC signature + expiry in the token itself (no DB call needed for this step)
  const payload = verifyCaptainToken(params.token)
  if (!payload) {
    return Response.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()

  // 2. Verify the token version still matches DB (handles revocation)
  const { data: trip } = await supabase
    .from('trips')
    .select('id, captain_token, captain_token_version, captain_token_expires_at, status')
    .eq('id', payload.tripId)
    .eq('captain_token_version', payload.version)  // ← version check = revocation
    .single()

  if (!trip) {
    return Response.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  // 3. DB-level expiry check (belt-and-suspenders — token HMAC already checked this)
  if (
    trip.captain_token_expires_at &&
    new Date(trip.captain_token_expires_at) < new Date()
  ) {
    return Response.json(
      { error: 'This captain link has expired. Ask the operator to share a new one.' },
      { status: 401 }
    )
  }

  // Continue with existing snapshot data assembly...
  // (preserve all existing return logic below this point)
}
```

---

## API Route: Add Token Regeneration Endpoint

Create `apps/web/app/api/dashboard/trips/[id]/regenerate-captain-token/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { generateCaptainToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Fetch current version — verify operator owns this trip
  const { data: trip } = await supabase
    .from('trips')
    .select('id, operator_id, captain_token_version')
    .eq('id', params.id)
    .eq('operator_id', operator.id)  // ownership check
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const newVersion = (trip.captain_token_version ?? 1) + 1
  const { token, expiresAt } = generateCaptainToken(trip.id, newVersion)

  const { error } = await supabase
    .from('trips')
    .update({
      captain_token: token,
      captain_token_version: newVersion,
      captain_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', trip.id)

  if (error) {
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 500 })
  }

  return NextResponse.json({ token, expiresAt })
}
```

---

## Trip Creation: Update Token Generation

Open `apps/web/app/api/dashboard/trips/route.ts` (POST handler). Find where `captain_token` is generated and assigned to the new trip. Replace it to use the new function:

```typescript
import { generateCaptainToken } from '@/lib/security/tokens'

// Inside the trip creation logic, replace the old token generation:
const { token: captainToken, expiresAt: captainTokenExpiresAt } =
  generateCaptainToken(newTripId, 1)

// Then pass into the insert:
{
  // ...existing trip fields...
  captain_token: captainToken,
  captain_token_expires_at: captainTokenExpiresAt.toISOString(),
  captain_token_version: 1,
}
```

---

## Dashboard UI: Expose Regenerate Button

Open `apps/web/components/captain/CaptainSnapshotView.tsx` (or the trip detail component that shows the captain share link — read the file first to locate the right component). Add a "Refresh captain link" button adjacent to the existing captain link copy/share UI.

Design requirements (per DESIGN.md):
- Button: `text-label` size, `--mid-blue` colour, ghost style (no fill)
- Icon: `RefreshCw` from Lucide, 14px, 1.5px stroke
- On click: call `POST /api/dashboard/trips/[id]/regenerate-captain-token`, show loading state, on success update the displayed token in local state and show a `NotificationToast` with "Captain link refreshed. Old link is now invalid."
- Show token expiry time below the link: "Expires in 71h" (compute from `captain_token_expires_at`)

---

## Invariants

| Rule | Reason |
|---|---|
| `verifyCaptainToken` returns `null` for ANY failure — never throw | Prevents timing-based enumeration of why a token failed |
| Never log the token value itself | Tokens in logs = tokens in log aggregation tools = leaked access |
| The DB version check must use `.eq('captain_token_version', payload.version)` | This is what makes immediate revocation work without a token blocklist |
| Error messages to the client must be identical for expired vs invalid | Prevents distinguishing between "token exists but expired" vs "token never existed" |

---

## Verification

```
□ Generate a trip → captain token has expiresAt ~72h in the future
□ Use the captain snapshot URL → renders correctly
□ Manually set captain_token_expires_at to 1 minute ago in DB → snapshot returns 401
□ Regenerate token from dashboard → old URL returns 401, new URL works
□ Pass a token with invalid signature → returns 401
□ Pass a token with correct signature but wrong version → returns 401
□ TypeScript: tsc --noEmit with zero errors
□ CAPTAIN_TOKEN_SECRET added to .env.local
```

---
---

# TASK 3 — Boat CRUD API
**Gap:** Boats can be created via the wizard template endpoint, but there is no API to list an operator's boats, update a boat's details, or deactivate a boat. The `GET /api/dashboard/boats` and `PUT /api/dashboard/boats/[id]` routes exist in the architecture spec but currently return 501.

---

## Pre-Task: Read Before Touching Anything

1. Read `apps/web/app/api/dashboard/boats/route.ts` — confirm it is a stub and understand its exact current shape.
2. Read `apps/web/app/api/dashboard/wizard/template/[boatType]/route.ts` — this is the working boat template endpoint. Understand what fields the wizard writes into the `boats` table on trip creation so you do not break that flow.
3. Read `apps/web/lib/supabase/service.ts` — confirm service client import path.
4. Read `apps/web/lib/security/auth.ts` — confirm `requireOperator()` return shape.
5. Read the `boats` table definition in `supabase/migrations/001_initial_schema.sql` — confirm every column name before writing Zod schemas. The DATABASE.md schema is the canonical reference but the live migration file is ground truth.
6. Read `apps/web/types/` directory — check if `Boat` types already exist. If they do, use them. Do not create duplicate type definitions.

---

## Schema Change: New Migration

Create `supabase/migrations/006_boat_crud_additions.sql`:

```sql
-- Migration 006: Boat CRUD additions
-- Adds deactivation tracking column used by the CRUD API.
-- The is_active column already exists. This migration adds a soft-delete
-- audit trail so operators can understand when a boat was deactivated.

ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS deactivated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by  UUID REFERENCES operators(id);

COMMENT ON COLUMN boats.deactivated_at IS
  'Set when operator deactivates a boat. NULL = active.';

-- Index: dashboard boat list always filters by operator_id
-- (may already exist from 001 — use IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS boats_operator_id_idx
  ON boats (operator_id)
  WHERE is_active = true;
```

---

## API Route: `GET /api/dashboard/boats`

Open `apps/web/app/api/dashboard/boats/route.ts`. Replace the 501 stub entirely. This file will export both `GET` and `POST` handlers:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

// ─── GET — List operator's boats ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (await rateLimit(req, { max: 60, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: boats, error } = await supabase
    .from('boats')
    .select(`
      id,
      boat_name,
      boat_type,
      charter_type,
      marina_name,
      marina_address,
      slip_number,
      max_capacity,
      captain_name,
      captain_photo_url,
      is_active,
      deactivated_at,
      created_at,
      photo_urls,
      addons (
        id, name, price_cents, is_available, emoji
      )
    `)
    .eq('operator_id', operator.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[boats/GET] db error:', error.code)
    return NextResponse.json({ error: 'Failed to load boats' }, { status: 500 })
  }

  return NextResponse.json({ data: boats })
}
```

---

## API Route: `PUT /api/dashboard/boats/[id]`

Create `apps/web/app/api/dashboard/boats/[id]/route.ts`. This file will export `GET` (single boat), `PATCH` (update), and `DELETE` (deactivate — soft):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

// Zod schema — all fields optional (PATCH semantics)
// Only include fields operators are permitted to update post-creation.
// operator_id, id, created_at are never updatable via API.
const boatUpdateSchema = z.object({
  boat_name:             z.string().min(2).max(100).optional(),
  boat_type:             z.enum(['yacht','catamaran','motorboat','sailboat',
                                  'pontoon','fishing','speedboat','other']).optional(),
  charter_type:          z.enum(['captained','bareboat','both']).optional(),
  year_built:            z.number().int().min(1900).max(2030).optional().nullable(),
  length_ft:             z.number().min(1).max(500).optional().nullable(),
  max_capacity:          z.number().int().min(1).max(500).optional(),
  weight_limit_lbs:      z.number().int().optional().nullable(),
  marina_name:           z.string().min(2).max(200).optional(),
  marina_address:        z.string().min(2).max(500).optional(),
  slip_number:           z.string().max(20).optional().nullable(),
  parking_instructions:  z.string().max(1000).optional().nullable(),
  lat:                   z.number().min(-90).max(90).optional().nullable(),
  lng:                   z.number().min(-180).max(180).optional().nullable(),
  captain_name:          z.string().max(100).optional().nullable(),
  captain_photo_url:     z.string().url().optional().nullable(),
  captain_bio:           z.string().max(2000).optional().nullable(),
  captain_license:       z.string().max(100).optional().nullable(),
  captain_languages:     z.array(z.string().length(2)).max(10).optional(),
  captain_years_exp:     z.number().int().min(0).max(60).optional().nullable(),
  what_to_bring:         z.string().max(2000).optional().nullable(),
  house_rules:           z.string().max(2000).optional().nullable(),
  prohibited_items:      z.string().max(2000).optional().nullable(),
  safety_briefing:       z.string().max(5000).optional().nullable(),
  waiver_text:           z.string().min(50).max(10000).optional(),
  cancellation_policy:   z.string().max(2000).optional().nullable(),
  onboard_info:          z.record(z.unknown()).optional(),
  photo_urls:            z.array(z.string().url()).max(20).optional(),
})

// ─── GET — Single boat ────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: boat, error } = await supabase
    .from('boats')
    .select('*, addons(*)')
    .eq('id', params.id)
    .eq('operator_id', operator.id)  // ownership check
    .single()

  if (error || !boat) {
    return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
  }

  return NextResponse.json({ data: boat })
}

// ─── PATCH — Update boat fields ───────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (await rateLimit(req, { max: 30, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { operator } = await requireOperator()

  const raw = await req.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const parsed = boatUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify ownership before update — never trust the body to contain operator_id
  const { data: existing } = await supabase
    .from('boats')
    .select('id, operator_id, is_active')
    .eq('id', params.id)
    .eq('operator_id', operator.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
  }

  if (!existing.is_active) {
    return NextResponse.json(
      { error: 'Cannot update a deactivated boat. Reactivate it first.' },
      { status: 409 }
    )
  }

  const { data: updated, error } = await supabase
    .from('boats')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('operator_id', operator.id)  // double-guard on operator ownership
    .select()
    .single()

  if (error) {
    console.error('[boats/PATCH] db error:', error.code)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}

// ─── DELETE — Soft deactivate (never hard delete) ─────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Check: cannot deactivate a boat that has upcoming or active trips
  const { count: activeTrips } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('boat_id', params.id)
    .eq('operator_id', operator.id)
    .in('status', ['upcoming', 'active'])

  if ((activeTrips ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Cannot deactivate this boat — it has ${activeTrips} upcoming or active trip(s). Cancel or complete those trips first.`,
      },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('boats')
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: operator.id,
    })
    .eq('id', params.id)
    .eq('operator_id', operator.id)

  if (error) {
    console.error('[boats/DELETE] db error:', error.code)
    return NextResponse.json({ error: 'Deactivation failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ─── POST (reactivate) ────────────────────────────────────────────────────────
// Mounted at /api/dashboard/boats/[id]/reactivate — see next route file
```

Create `apps/web/app/api/dashboard/boats/[id]/reactivate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()

  // Check operator's boat limit before reactivating
  const supabase = createServiceClient()

  const { count: activeBoats } = await supabase
    .from('boats')
    .select('id', { count: 'exact', head: true })
    .eq('operator_id', operator.id)
    .eq('is_active', true)

  if ((activeBoats ?? 0) >= operator.max_boats) {
    return NextResponse.json(
      {
        error: `Your plan allows ${operator.max_boats} active boat(s). Upgrade your plan to add more.`,
      },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('boats')
    .update({
      is_active: true,
      deactivated_at: null,
      deactivated_by: null,
    })
    .eq('id', params.id)
    .eq('operator_id', operator.id)

  if (error) {
    return NextResponse.json({ error: 'Reactivation failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

## Addon CRUD Sub-Routes

Addons are per-boat. Since operators now need a way to manage addons independently of the wizard, create these two routes:

`apps/web/app/api/dashboard/boats/[id]/addons/route.ts` — POST (create addon):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const addonCreateSchema = z.object({
  name:         z.string().min(1).max(100),
  description:  z.string().max(500).optional().nullable(),
  emoji:        z.string().max(4).default('🎁'),
  price_cents:  z.number().int().min(0).max(100000),
  max_quantity: z.number().int().min(1).max(100).default(10),
  sort_order:   z.number().int().min(0).default(0),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const raw = await req.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = addonCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify boat ownership
  const { data: boat } = await supabase
    .from('boats')
    .select('id')
    .eq('id', params.id)
    .eq('operator_id', operator.id)
    .single()

  if (!boat) return NextResponse.json({ error: 'Boat not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('addons')
    .insert({ ...parsed.data, boat_id: params.id, operator_id: operator.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create addon' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
```

`apps/web/app/api/dashboard/addons/[id]/route.ts` — PATCH + DELETE for individual addons:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const addonUpdateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  description:  z.string().max(500).optional().nullable(),
  emoji:        z.string().max(4).optional(),
  price_cents:  z.number().int().min(0).max(100000).optional(),
  max_quantity: z.number().int().min(1).max(100).optional(),
  is_available: z.boolean().optional(),
  sort_order:   z.number().int().min(0).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const raw = await req.json().catch(() => null)
  const parsed = addonUpdateSchema.safeParse(raw ?? {})
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('addons')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('operator_id', operator.id)   // ownership
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Addon not found or update failed' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Soft delete: set is_available = false rather than hard delete
  // Hard delete would break historical guest_addon_orders records
  const { error } = await supabase
    .from('addons')
    .update({ is_available: false })
    .eq('id', params.id)
    .eq('operator_id', operator.id)

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

---

## Invariants

| Rule | Reason |
|---|---|
| Never hard-delete addons | `guest_addon_orders` has FK to `addons.id` — hard delete orphans historical order records |
| Never hard-delete boats | Historical trips reference `boat_id` — soft deactivate only |
| Always `.eq('operator_id', operator.id)` on every update/delete | Belt-and-suspenders against RLS misconfiguration |
| Block deactivation of boats with upcoming/active trips | Prevents captain snapshot from referencing a deactivated boat mid-trip |
| PATCH is field-level (partial) — never require full object | Operators editing one field should not accidentally null other fields |

---

## Verification

```
□ GET /api/dashboard/boats → returns array of operator's boats with addons
□ PATCH /api/dashboard/boats/[id] with { boat_name: "New Name" } → updates name only
□ PATCH /api/dashboard/boats/[id] with another operator's boat ID → 404
□ DELETE /api/dashboard/boats/[id] with active trip → 409 with clear error message
□ DELETE /api/dashboard/boats/[id] with no active trips → is_active set to false
□ POST /api/dashboard/boats/[id]/reactivate when at plan limit → 403
□ POST /api/dashboard/boats/[id]/addons → creates addon, returns 201
□ PATCH /api/dashboard/addons/[id] from different operator → 404
□ All routes return 401 when called without operator session
□ TypeScript: tsc --noEmit with zero errors
```

---
---

# TASK 4 — Push Notification Service Worker
**Gap:** `lib/notifications/push.ts` has full VAPID web-push plumbing to send notifications to guests. But there is no `sw.js` (service worker) file in `apps/web/public/`, so browsers have nothing to receive and display the notifications even if they arrive.

---

## Pre-Task: Read Before Touching Anything

1. Read `apps/web/public/` directory listing — confirm `sw.js` does not already exist. Also check for a `manifest.json` — the PWA manifest must declare `gcm_sender_id` is NOT required for modern Web Push, but it must reference correct icon paths.
2. Read `apps/web/lib/notifications/push.ts` in full — understand the exact payload shape being sent via `webpush.sendNotification`. The service worker must handle the same JSON structure.
3. Read `apps/web/app/layout.tsx` — confirm how the service worker is (or should be) registered. If `next-pwa` is configured, it may auto-generate a service worker. If it is, do NOT create a manual `sw.js` that conflicts with it.
4. Read `apps/web/next.config.js` (or `next.config.ts`) — if `next-pwa` is configured with `dest: 'public'`, it writes its own service worker. In that case follow the **next-pwa path** below. If `next-pwa` is NOT configured, follow the **manual path**.

---

## Two Paths — Confirm Which Applies

### Path A — Manual Service Worker (next-pwa not configured or not writing sw.js)

Create `apps/web/public/sw.js`:

```javascript
// BoatCheckin Service Worker
// Handles: push notifications, offline cache, background sync
// Version: 1.0.0 — bump this string to force sw update on all clients

const SW_VERSION = '1.0.0'
const CACHE_NAME = `dockpass-${SW_VERSION}`

// Static assets to precache on install
// Keep this list minimal — only assets required for the offline trip page
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/badge-72.png',
]

// ─── Install: precache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  // Activate immediately — do not wait for old tabs to close
  self.skipWaiting()
})

// ─── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  // Take control of all open clients immediately
  self.clients.claim()
})

// ─── Fetch: network-first for API, cache-first for static ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API routes or Supabase calls
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('open-meteo.com')
  ) {
    return // fall through to browser default
  }

  // Cache-first for same-origin static assets (js, css, images)
  if (
    request.method === 'GET' &&
    (url.pathname.match(/\.(js|css|png|jpg|webp|svg|ico|woff2?)$/) ||
      url.pathname.startsWith('/_next/static/'))
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Network-first for pages — fall back to /offline if completely offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline') ?? new Response('Offline', { status: 503 })
      )
    )
  }
})

// ─── Push: receive and display notifications ────────────────────────────────
self.addEventListener('push', (event) => {
  // Guard: if push arrives with no data, show a generic notification
  if (!event.data) {
    event.waitUntil(
      self.registration.showNotification('BoatCheckin', {
        body: 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
      })
    )
    return
  }

  let payload
  try {
    payload = event.data.json()
  } catch {
    // Malformed payload — log and show generic
    console.warn('[sw] push payload parse error')
    event.waitUntil(
      self.registration.showNotification('BoatCheckin', {
        body: 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
      })
    )
    return
  }

  // payload shape matches lib/notifications/push.ts sendPushToGuest:
  // { title, body, icon, badge, url, data: { url } }
  const {
    title = 'BoatCheckin',
    body = '',
    icon = '/icons/icon-192.png',
    badge = '/icons/badge-72.png',
    url = '/',
    data = {},
  } = payload

  const options = {
    body,
    icon,
    badge,
    data: { url: data.url ?? url },
    // Actions give users quick-tap options without opening the app
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    // Vibration pattern: tap-tap-hold
    vibrate: [100, 50, 100],
    // Tag groups notifications by URL to prevent stacking
    tag: url,
    // Replace any existing notification with the same tag
    renotify: false,
    // Keep notification visible until user interacts with it
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification click: open or focus the target URL ───────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If the target URL is already open in a tab, focus it
        for (const client of clients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// ─── Push subscription change: handle browser-initiated re-subscription ─────
// This fires when the browser rotates push subscription credentials
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: self.VAPID_PUBLIC_KEY, // set at registration time
      })
      .then((subscription) => {
        // POST the new subscription to update it in Supabase
        return fetch('/api/push/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        })
      })
  )
})
```

---

### Path B — next-pwa Custom Worker (next-pwa is configured)

If `next-pwa` is configured in `next.config.js`, it generates its own `sw.js`. Do not create a manual `sw.js` — they will conflict. Instead, create `apps/web/worker/index.ts` which `next-pwa` picks up as a custom worker to be bundled into its generated service worker:

```typescript
// apps/web/worker/index.ts
// next-pwa custom worker — merged into the generated sw.js

// Push notification handler
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let payload: { title?: string; body?: string; icon?: string; badge?: string; url?: string; data?: { url: string } }
  try { payload = event.data.json() }
  catch { return }

  const { title = 'BoatCheckin', body = '', icon = '/icons/icon-192.png',
          badge = '/icons/badge-72.png', data = { url: '/' } } = payload

  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
      vibrate: [100, 50, 100],
      tag: data.url,
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: 'window' })
      .then((clients) => {
        const match = clients.find((c) => c.url === url)
        return match ? match.focus() : (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url)
      })
  )
})
```

---

## Service Worker Registration

Open `apps/web/app/layout.tsx`. Add the service worker registration script. Place it at the end of the `<body>`, before the closing tag:

```tsx
{/* Service worker registration — push notifications */}
<script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then(function(reg) {
              console.log('[sw] registered, scope:', reg.scope);
            })
            .catch(function(err) {
              console.warn('[sw] registration failed:', err);
            });
        });
      }
    `,
  }}
/>
```

> **Note:** `dangerouslySetInnerHTML` is acceptable here because the content is a hardcoded string literal with no user input. This is standard practice for inline scripts in Next.js App Router.

---

## Push Subscription API Route

The `pushsubscriptionchange` event in the service worker calls `POST /api/push/subscription`. Create this route:

`apps/web/app/api/push/subscription/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

// Called by service worker when browser rotates push credentials
// No operator auth — this is guest-facing. Guest identity via guestId in body.
const schema = z.object({
  guestId:      z.string().uuid(),
  subscription: z.object({
    endpoint:  z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
})

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('guests')
    .update({ push_subscription: parsed.data.subscription })
    .eq('id', parsed.data.guestId)
    .is('deleted_at', null)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

## Required Icons

The service worker references `/icons/icon-192.png`, `/icons/icon-512.png`, and `/icons/badge-72.png`. Check if these already exist in `apps/web/public/icons/`. If they do not:

1. Create placeholder icons using the BoatCheckin design system: navy (`#0C447C`) background, white anchor emoji `⚓` centered.
2. The badge icon (`badge-72.png`) should be monochrome (white on transparent) — browsers use this as the status bar indicator.
3. Do not use external icon generation services. If you cannot generate the images programmatically within the project, create a comment file at `apps/web/public/icons/MISSING_ICONS.md` listing exactly what is needed so the designer can generate them.

---

## Invariants

| Rule | Reason |
|---|---|
| Never intercept `/api/*` requests in the service worker fetch handler | Would cache API responses, causing stale data on dashboard and guest pages |
| The `tag` field on notifications must be the destination URL | Groups duplicate notifications (e.g. two weather alerts for same trip) into one notification bubble |
| `self.skipWaiting()` + `self.clients.claim()` must be paired | Without `claim()`, open tabs are not controlled by the new SW until they reload — push notifications would not show on already-open tabs |
| Service worker file must be at `/sw.js` (root of public) | The scope defaults to the directory the SW file is in — placing it in a subdirectory would restrict its scope |
| `pushsubscriptionchange` handler must re-POST to `/api/push/subscription` | Without this, subscriptions silently expire when the browser rotates VAPID credentials, and future pushes silently fail with 410 |

---

## Verification

```
□ Chrome DevTools → Application → Service Workers → sw.js shows as "Activated and running"
□ No console errors on page load related to service worker
□ Chrome DevTools → Application → Push Messaging → "Test push message" fires → notification appears
□ Click notification → browser opens/focuses the correct URL from notification data
□ Navigate to a trip page offline → /offline fallback page renders (or cached version)
□ Check network tab: /api/* requests are NOT served from cache
□ sw.js is accessible at https://[host]/sw.js with Content-Type: application/javascript
□ No TypeScript errors if using next-pwa worker path: tsc --noEmit
□ /api/push/subscription POST with valid guestId + subscription → 200 success
□ /api/push/subscription POST with invalid UUID → 400 validation error
```

---

# Cross-Task Verification

After all four tasks are complete, run this final check to confirm nothing was broken across the system:

```
□ supabase db reset + supabase db push — zero errors, all migrations apply in correct order
□ tsc --noEmit in apps/web/ — zero TypeScript errors
□ npm run build in apps/web/ — zero build errors
□ All existing API routes still return correct responses (spot-check: /api/trips/[slug], /api/dashboard/trips)
□ Captain snapshot page renders correctly with a fresh trip
□ Guest registration flow still works end-to-end (code → waiver → boarding pass)
□ Dashboard still loads with correct boat list (GET /api/dashboard/boats now returns data, not 501)
□ Service worker registered in browser, push test succeeds
□ No regressions in middleware.ts from Task from previous batch (dashboard still redirects unauthenticated users)
```
