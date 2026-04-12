# BoatCheckin — Phase Audit & Boat Onboarding Complete Spec
# @PHASE_AUDIT
# Conducted: April 2026
# Covers: Phase 1 (Auth), Phase 2 (Boat Wizard),
#         Database gaps, Security checks,
#         Backend tests, Frontend checks,
#         Complete boat onboarding agent instruction

---

## PART 1 — PHASE 1 AUDIT (Auth Foundation)

### What was built (confirmed ✅)
```
callback/route.ts       Email confirmation handler
(auth)/layout.tsx       Centered card, redirects if logged in
signup/page.tsx         Metadata + renders SignupForm
signup/SignupForm.tsx    4 fields, Zod, eye toggle
signup/actions.ts       Auth + operator insert + audit
login/page.tsx          Reads ?error param, shows banner
login/LoginForm.tsx     Email + password, generic errors
login/actions.ts        signInWithPassword + audit
login/error-messages.ts AUTH_ERRORS map
forgot-password/page.tsx Two-state: request → confirmation
dashboard/layout.tsx    Protected, BottomNav + Sidebar
dashboard/page.tsx      Time-based greeting + CTA
dashboard/actions.ts    signOut server action
BottomNav.tsx           Mobile: 4 tabs with active state
Sidebar.tsx             Desktop: 5 tabs + operator info
cn.ts                   clsx + tailwind-merge utility
```
Commit: 9550b3e | 17 files | +937 lines | ✅ zero errors

### Phase 1 Issues Found

**P1-ISSUE-1: Missing password reset completion page**
```
STATUS: GAP — forgot-password sends reset email
but /auth/reset-password page does not exist.
When user clicks email link they land on 404.

MUST FIX before Phase 3.

Create: apps/web/app/auth/reset-password/page.tsx
  - Reads token from URL hash (#access_token=...)
  - Form: new password + confirm password
  - Calls supabase.auth.updateUser({ password })
  - On success: redirect /login?message=password_reset
  - On error: show error, link back to forgot-password
```

**P1-ISSUE-2: No rate limiting on auth routes**
```
STATUS: SECURITY GAP — login and signup have
no brute-force protection beyond Supabase defaults.

Supabase default: 30 requests per hour per IP.
This is sufficient for now but must verify
Supabase project has rate limiting enabled.

CHECK: Supabase Dashboard →
  Authentication → Rate Limits
  Verify these are set:
  - Email sign-ups: 3 per hour
  - Password resets: 3 per hour  
  - Email OTPs: 3 per hour
```

**P1-ISSUE-3: Signup does not verify email exists**
```
STATUS: MINOR — after signup, user is redirected
to /dashboard/boats/new without verifying email.
If Supabase email confirmation is ON, user lands
on boats/new page before confirming.

CHECK: Supabase Auth settings.
For MVP: keep email confirmation OFF (less friction).
For production: handle unconfirmed email state.
```

**P1-ISSUE-4: Dashboard layout missing trial expiry banner**
```
STATUS: MISSING FEATURE — operators on trial
have no visual indicator of days remaining.

Add to dashboard/layout.tsx:
  If operator.subscription_status === 'trial':
    And trial_ends_at is within 7 days:
    Show amber banner at top:
    "Your free trial ends in [X] days.
     [Upgrade now →]"
```

**P1-ISSUE-5: Sidebar missing active state for /dashboard/boats**
```
STATUS: UX GAP — when operator is on
/dashboard/boats/new the sidebar shows
no active nav item. Disorienting.

Fix: update active state logic in Sidebar.tsx
to match /dashboard/boats/* under "Boats" nav
(add Boats as a 5th nav item or highlight Home).
```

### Phase 1 Tests to Run NOW
```
TEST P1-1: Password reset end-to-end
  1. Request reset for known email
  2. Receive email (check Resend dashboard)
  3. Click link → should land on reset page
  4. Enter new password → should redirect to login
  EXPECTED: ❌ FAILS — reset page missing

TEST P1-2: Protected routes
  1. Open incognito
  2. Visit /dashboard directly → ✅ redirects to /login
  3. Visit /dashboard/boats/new → ✅ should redirect
  4. Visit /dashboard/trips → ✅ should redirect

TEST P1-3: Auth errors
  1. Login with wrong password
  2. Should show generic "Incorrect email or password"
  3. Should NOT show Supabase internal error
  4. Should NOT specify which field is wrong

TEST P1-4: Signup duplicate email
  1. Try to register same email twice
  2. Should show "Email already registered"
  3. Should NOT crash

TEST P1-5: Session persistence
  1. Login successfully
  2. Close browser tab
  3. Reopen /dashboard
  4. Should remain logged in (session persisted)
```

---

## PART 2 — PHASE 2 AUDIT (Boat Wizard)

### Status
```
PHASE 2 WAS DESIGNED BUT NOT YET BUILT.
The agent instruction was written in this session.

This audit reviews the design for issues
BEFORE the build starts.
```

### Critical Design Issues Found

**P2-ISSUE-1: Database does not support new wizard fields**
```
STATUS: CRITICAL — The current boats table schema
(from migration 001) is missing these fields
that the new 8-step wizard collects:

MISSING FROM boats TABLE:
  selected_equipment    TEXT[]  (step 4)
  selected_amenities    JSONB   (step 4)
  specific_field_values JSONB   (step 4 type-specific)
  custom_dos            TEXT[]  (step 5)
  custom_donts          TEXT[]  (step 5)
  custom_rule_sections  JSONB   (step 5 custom sections)
  what_not_to_bring     TEXT    (step 6 — separate from what_to_bring)
  safety_points         JSONB   (step 7 structured cards)
  operating_area        TEXT    (step 2 addition)
  weight_limit_lbs      INT     (already exists ✅)
  uscg_doc_number       TEXT    (step 1 addition)
  registration_state    TEXT    (step 1 addition)
  captain_license_type  TEXT    (step 3 addition)
  captain_certifications TEXT[] (step 3 new)
  captain_trip_count    INT     (already exists ✅)
  captain_rating        NUMERIC (already exists ✅)

MIGRATION 002 REQUIRED before Phase 2 build.
See Part 4 of this document.
```

**P2-ISSUE-2: Scraper references must be fully removed**
```
STATUS: MUST REMOVE — multiple agent files
still reference the URL scraper:
  ARCHITECTURE.md: "Scraping: Apify"
  HOWTO.md: Feature 5 "Boatsetter URL Import"
  BACKEND.md: boat import route
  INFRA_SETUP.md: APIFY_API_TOKEN
  DEPENDENCIES.md: APIFY_API_TOKEN in .env

The decision is confirmed: NO SCRAPING.
The wizard is pure manual entry with
intelligent templates.

Action: Remove all scraper references.
APIFY_API_TOKEN no longer needed.
/api/dashboard/boats/import route not built.
HOWTO.md Feature 5 replaced by this wizard.
```

**P2-ISSUE-3: boat-templates.ts is too large for client**
```
STATUS: PERFORMANCE — The boat-templates.ts file
contains 8 complete templates with waiver text,
safety briefing, suggested addons etc.
This is ~50KB of data.

If imported client-side it bloats the bundle.
Must be server-only and served via API route
when boat type is selected.

Fix:
  Keep boat-templates.ts as server-only
  Add 'import server-only' at top
  
  Create: /api/dashboard/wizard/template/
    [boatType]/route.ts
  
  Returns only the template data needed
  for the current step (not everything at once)
  
  Wizard fetches template data per-step
  not all at once on type selection.
```

**P2-ISSUE-4: Photo upload needs chunked approach**
```
STATUS: RELIABILITY — Step 8 allows 12 photos.
At 5MB each = 60MB potential upload.
Next.js serverless has 4.5MB body limit by default.

Fix: Upload photos directly to Supabase Storage
from the browser using the anon client.
NOT via Server Action (which has size limit).

Pattern:
  const supabase = createSupabaseBrowser()
  const { data } = await supabase.storage
    .from('boat-photos')
    .upload(path, file)
  
  Store returned URLs in wizard state.
  Server Action only saves URLs (not files).
```

**P2-ISSUE-5: Drag-to-reorder needs accessibility**
```
STATUS: COMPLIANCE — @dnd-kit drag and drop
must have keyboard navigation fallback.
WCAG 2.1 AA requires this.

@dnd-kit supports keyboard natively.
Ensure keyboard handlers are enabled
in all SortableContext implementations.
Each draggable item needs aria-describedby
explaining the keyboard instructions.
```

**P2-ISSUE-6: Waiver text must be hashed**
```
STATUS: LEGAL — When waiver is saved, the
exact text shown to guests must be preserved.
If operator edits waiver AFTER guests have signed,
old signatures are still valid against
the OLD waiver text, not the new one.

Fix: Store waiver_text_hash (SHA256) on boat.
When trip is created: snapshot waiver text + hash
onto the trip record (not just referenced).
So waiver changes don't retroactively affect
trips already created.

Add to trips table (migration 002):
  waiver_snapshot TEXT    -- copy of waiver at trip creation
  waiver_hash     TEXT    -- SHA256 of waiver at trip creation
```

---

## PART 3 — DATABASE AUDIT

### Current boats table gaps
```sql
-- MISSING COLUMNS that wizard collects
-- Add in migration 002:

ALTER TABLE boats
  ADD COLUMN operating_area TEXT,
  ADD COLUMN uscg_doc_number TEXT,
  ADD COLUMN registration_state TEXT,
  ADD COLUMN captain_license_type TEXT
    CHECK (captain_license_type IN (
      'oupv','master_25','master_50',
      'master_100','master_200'
    )),
  ADD COLUMN captain_certifications TEXT[]
    DEFAULT '{}',
  ADD COLUMN selected_equipment TEXT[]
    DEFAULT '{}',
  ADD COLUMN selected_amenities JSONB
    DEFAULT '{}',
  ADD COLUMN specific_field_values JSONB
    DEFAULT '{}',
  ADD COLUMN custom_dos TEXT[]
    DEFAULT '{}',
  ADD COLUMN custom_donts TEXT[]
    DEFAULT '{}',
  ADD COLUMN custom_rule_sections JSONB
    DEFAULT '[]',
  ADD COLUMN what_not_to_bring TEXT,
  ADD COLUMN safety_points JSONB
    DEFAULT '[]',
  ADD COLUMN boat_type_key TEXT
    CHECK (boat_type_key IN (
      'motor_yacht','sailing_yacht','catamaran',
      'fishing_charter','pontoon','speedboat',
      'snorkel_dive','sunset_cruise','other'
    ));

-- Also update boat_type CHECK constraint
-- current: ('yacht','catamaran','motorboat',
--           'sailboat','pontoon','fishing',
--           'speedboat','other')
-- new values match boat_type_key

ALTER TABLE boats
  DROP CONSTRAINT boats_boat_type_check;
ALTER TABLE boats
  ADD CONSTRAINT boats_boat_type_check
  CHECK (boat_type IN (
    'motor_yacht','sailing_yacht','catamaran',
    'fishing_charter','pontoon','speedboat',
    'snorkel_dive','sunset_cruise','other'
  ));
```

### trips table gaps for waiver snapshot
```sql
ALTER TABLE trips
  ADD COLUMN waiver_snapshot TEXT,
  ADD COLUMN waiver_hash TEXT,
  ADD COLUMN started_at TIMESTAMPTZ,
  ADD COLUMN ended_at TIMESTAMPTZ,
  ADD COLUMN started_by_captain TEXT,
  ADD COLUMN guest_count_at_start INT,
  ADD COLUMN buoy_policy_id TEXT;
```

### New indexes needed
```sql
-- Boat type queries (template loading)
CREATE INDEX idx_boats_type
  ON boats(boat_type);

CREATE INDEX idx_boats_operator_active
  ON boats(operator_id)
  WHERE is_active = true;

-- Trips date range queries
CREATE INDEX idx_trips_date_status
  ON trips(trip_date, status);

CREATE INDEX idx_trips_operator_upcoming
  ON trips(operator_id, trip_date)
  WHERE status = 'upcoming';
```

### Missing table: boat_photos (separate from array)
```sql
-- The photo_urls TEXT[] array on boats is fragile.
-- A separate table enables ordering, metadata,
-- and future features (alt text, thumbnails).

CREATE TABLE boat_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id       UUID NOT NULL REFERENCES boats(id)
                ON DELETE CASCADE,
  operator_id   UUID NOT NULL REFERENCES operators(id),
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_cover      BOOLEAN NOT NULL DEFAULT false,
  file_size     INT,
  width_px      INT,
  height_px     INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boat_photos_boat
  ON boat_photos(boat_id, display_order);

ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boat_photos_operator_owns"
  ON boat_photos
  FOR ALL USING (auth.uid() = operator_id);

CREATE POLICY "boat_photos_public_read"
  ON boat_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boats
      WHERE boats.id = boat_id
      AND boats.is_active = true
    )
  );
```

### RLS policy gaps
```sql
-- audit_log has no RLS — needs it
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Operators can read their own audit entries
CREATE POLICY "audit_operator_reads_own"
  ON audit_log
  FOR SELECT USING (auth.uid() = operator_id);

-- Only service role can INSERT to audit_log
-- (no policy = only service role can write)
-- This is correct behaviour — do not add INSERT policy
```

---

## PART 4 — BACKEND TEST SUITE

### Install test dependencies
```bash
npm install -D vitest @vitest/coverage-v8
  @testing-library/react @testing-library/jest-dom
  msw @mswjs/data
```

### Test file structure
```
apps/web/
  __tests__/
    unit/
      security/
        tokens.test.ts
        sanitise.test.ts
        rate-limit.test.ts
        uploads.test.ts
      auth/
        actions.test.ts
      wizard/
        boat-templates.test.ts
        step-validation.test.ts
      database/
        rls-policies.test.ts
    integration/
      api/
        auth-signup.test.ts
        auth-login.test.ts
        boat-create.test.ts
        boat-templates.test.ts
```

### COMPLETE TEST FILE: tokens.test.ts
```typescript
// apps/web/__tests__/unit/security/tokens.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateTripSlug,
  generateTripCode,
  generateQRToken,
  verifyQRToken,
} from '@/lib/security/tokens'

describe('generateTripSlug', () => {
  it('generates a string of correct minimum length', () => {
    const slug = generateTripSlug()
    expect(slug.length).toBeGreaterThanOrEqual(16)
  })

  it('only contains URL-safe characters', () => {
    const slug = generateTripSlug()
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('generates unique slugs on every call', () => {
    const slugs = new Set(
      Array.from({ length: 1000 }, generateTripSlug)
    )
    expect(slugs.size).toBe(1000)
  })
})

describe('generateTripCode', () => {
  it('generates exactly 4 characters', () => {
    const code = generateTripCode()
    expect(code).toHaveLength(4)
  })

  it('only contains uppercase alphanumeric', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateTripCode()
      expect(code).toMatch(/^[A-Z0-9]{4}$/)
    }
  })

  it('never contains ambiguous characters O, 0, I, 1', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateTripCode()
      expect(code).not.toMatch(/[O0I1]/)
    }
  })
})

describe('generateQRToken and verifyQRToken', () => {
  const guestId = 'guest-123-uuid'
  const tripId = 'trip-456-uuid'
  const todayDate = new Date().toISOString().split('T')[0]
  const futureDate = new Date(Date.now() + 86400000)
    .toISOString().split('T')[0]
  const pastDate = '2020-01-01'

  it('generates a verifiable token', () => {
    const token = generateQRToken(guestId, tripId, futureDate)
    const result = verifyQRToken(token)
    expect(result).not.toBeNull()
    expect(result?.guestId).toBe(guestId)
    expect(result?.tripId).toBe(tripId)
    expect(result?.expired).toBe(false)
  })

  it('detects expired token', () => {
    const token = generateQRToken(guestId, tripId, pastDate)
    const result = verifyQRToken(token)
    expect(result).not.toBeNull()
    expect(result?.expired).toBe(true)
  })

  it('rejects tampered token', () => {
    const token = generateQRToken(guestId, tripId, futureDate)
    const parts = token.split('.')
    const tampered = parts[0] + '.AAAA_TAMPERED_SIGNATURE'
    expect(verifyQRToken(tampered)).toBeNull()
  })

  it('rejects token with modified payload', () => {
    const token = generateQRToken(guestId, tripId, futureDate)
    const [, sig] = token.split('.')
    const fakePayload = Buffer.from(
      'fake-guest:fake-trip:9999999999'
    ).toString('base64url')
    expect(verifyQRToken(`${fakePayload}.${sig}`)).toBeNull()
  })

  it('rejects empty string', () => {
    expect(verifyQRToken('')).toBeNull()
  })

  it('rejects malformed token (no dot)', () => {
    expect(verifyQRToken('nodotinhere')).toBeNull()
  })

  it('two tokens for same guest are different', () => {
    const t1 = generateQRToken(guestId, tripId, futureDate)
    const t2 = generateQRToken(guestId, tripId, futureDate)
    // Tokens have timestamp in payload so will differ
    expect(t1).not.toBe(t2)
  })
})
```

### COMPLETE TEST FILE: sanitise.test.ts
```typescript
// apps/web/__tests__/unit/security/sanitise.test.ts
import { describe, it, expect } from 'vitest'
import {
  sanitiseText,
  sanitiseInput,
  guestRegistrationSchema,
  boatSetupSchema,
  tripCreationSchema,
} from '@/lib/security/sanitise'

describe('sanitiseText', () => {
  it('strips script tags', () => {
    expect(sanitiseText('<script>alert(1)</script>Sofia'))
      .toBe('Sofia')
  })

  it('strips event handlers', () => {
    expect(sanitiseText('<img onerror="alert(1)" src="x">'))
      .toBe('')
  })

  it('strips HTML tags completely', () => {
    expect(sanitiseText('<b>bold</b> text'))
      .toBe('bold text')
  })

  it('trims whitespace', () => {
    expect(sanitiseText('  hello  ')).toBe('hello')
  })

  it('enforces max length of 1000', () => {
    const long = 'a'.repeat(2000)
    expect(sanitiseText(long)).toHaveLength(1000)
  })

  it('preserves normal text unchanged', () => {
    expect(sanitiseText('Captain Conrad Rivera'))
      .toBe('Captain Conrad Rivera')
  })

  it('preserves unicode characters', () => {
    expect(sanitiseText('Sofía Martínez'))
      .toBe('Sofía Martínez')
  })
})

describe('sanitiseInput (recursive)', () => {
  it('sanitises nested object', () => {
    const result = sanitiseInput({
      name: '<b>bold</b>',
      nested: { field: '<script>alert()</script>value' }
    }) as Record<string, unknown>
    expect((result.name)).toBe('bold')
    expect((result.nested as Record<string, string>).field)
      .toBe('value')
  })

  it('sanitises arrays', () => {
    const result = sanitiseInput([
      '<b>item1</b>',
      'normal'
    ]) as string[]
    expect(result[0]).toBe('item1')
    expect(result[1]).toBe('normal')
  })
})

describe('guestRegistrationSchema', () => {
  const valid = {
    tripSlug: 'xK9m2aQr7nB4xyz01234',
    tripCode: 'SUN4',
    fullName: 'Sofia Martinez',
    emergencyContactName: 'Maria Martinez',
    emergencyContactPhone: '+1 305 555 0100',
    languagePreference: 'en' as const,
    waiverSignatureText: 'Sofia Martinez',
    waiverAgreed: true as const,
  }

  it('accepts valid registration', () => {
    expect(guestRegistrationSchema.safeParse(valid).success)
      .toBe(true)
  })

  it('rejects short trip slug', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, tripSlug: 'short'
    }).success).toBe(false)
  })

  it('rejects trip code with lowercase', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, tripCode: 'sun4'
    }).success).toBe(false)
  })

  it('rejects trip code wrong length', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, tripCode: 'SU'
    }).success).toBe(false)
  })

  it('rejects name too short', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, fullName: 'A'
    }).success).toBe(false)
  })

  it('rejects waiverAgreed: false', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, waiverAgreed: false
    }).success).toBe(false)
  })

  it('rejects invalid phone number format', () => {
    expect(guestRegistrationSchema.safeParse({
      ...valid, emergencyContactPhone: 'not-a-phone'
    }).success).toBe(false)
  })
})

describe('boatSetupSchema', () => {
  it('rejects capacity over 500', () => {
    const result = boatSetupSchema.safeParse({
      boatName: 'Test Boat',
      boatType: 'motor_yacht',
      charterType: 'captained',
      maxCapacity: 501,
      marinaName: 'Miami Marina',
      marinaAddress: '123 Main St, Miami FL',
      waiverText: 'a'.repeat(100),
    })
    expect(result.success).toBe(false)
  })

  it('rejects waiver under 100 chars', () => {
    const result = boatSetupSchema.safeParse({
      boatName: 'Test Boat',
      boatType: 'motor_yacht',
      charterType: 'captained',
      maxCapacity: 8,
      marinaName: 'Miami Marina',
      marinaAddress: '123 Main St, Miami FL',
      waiverText: 'too short',
    })
    expect(result.success).toBe(false)
  })
})
```

### COMPLETE TEST FILE: uploads.test.ts
```typescript
// apps/web/__tests__/unit/security/uploads.test.ts
import { describe, it, expect } from 'vitest'
import {
  validateUpload,
  validateFileMagicBytes,
} from '@/lib/security/uploads'

describe('validateUpload', () => {
  const makeFile = (type: string, size: number) =>
    new File(['x'.repeat(size)], 'test.jpg', { type })

  it('accepts JPEG', () => {
    const file = makeFile('image/jpeg', 1000)
    expect(validateUpload(file).valid).toBe(true)
  })

  it('accepts PNG', () => {
    const file = makeFile('image/png', 1000)
    expect(validateUpload(file).valid).toBe(true)
  })

  it('accepts WebP', () => {
    const file = makeFile('image/webp', 1000)
    expect(validateUpload(file).valid).toBe(true)
  })

  it('rejects PDF', () => {
    const file = makeFile('application/pdf', 1000)
    const result = validateUpload(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPEG')
  })

  it('rejects files over 5MB', () => {
    const file = makeFile('image/jpeg', 6 * 1024 * 1024)
    const result = validateUpload(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('5MB')
  })

  it('accepts files exactly at 5MB limit', () => {
    const file = makeFile('image/jpeg', 5 * 1024 * 1024)
    expect(validateUpload(file).valid).toBe(true)
  })
})

describe('validateFileMagicBytes', () => {
  it('accepts valid JPEG magic bytes', async () => {
    // JPEG starts with FF D8 FF
    const buf = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00])
    expect(await validateFileMagicBytes(buf.buffer))
      .toBe(true)
  })

  it('accepts valid PNG magic bytes', async () => {
    // PNG starts with 89 50 4E 47
    const buf = new Uint8Array([0x89, 0x50, 0x4E, 0x47])
    expect(await validateFileMagicBytes(buf.buffer))
      .toBe(true)
  })

  it('rejects PHP file with fake jpg extension', async () => {
    // PHP file starts with <?php
    const buf = new Uint8Array([0x3C, 0x3F, 0x70, 0x68])
    expect(await validateFileMagicBytes(buf.buffer))
      .toBe(false)
  })

  it('rejects ZIP file', async () => {
    // ZIP starts with PK (50 4B)
    const buf = new Uint8Array([0x50, 0x4B, 0x03, 0x04])
    expect(await validateFileMagicBytes(buf.buffer))
      .toBe(false)
  })
})
```

### COMPLETE TEST FILE: boat-templates.test.ts
```typescript
// apps/web/__tests__/unit/wizard/boat-templates.test.ts
import { describe, it, expect } from 'vitest'
import {
  BOAT_TEMPLATES,
  getBoatTemplate,
  getDefaultsFromTemplate,
} from '@/lib/wizard/boat-templates'

describe('BOAT_TEMPLATES completeness', () => {
  const requiredKeys: (keyof typeof BOAT_TEMPLATES)[] = [
    'motor_yacht', 'sailing_yacht', 'catamaran',
    'fishing_charter', 'pontoon', 'speedboat',
    'snorkel_dive', 'sunset_cruise', 'other',
  ]

  requiredKeys.forEach(key => {
    describe(`Template: ${key}`, () => {
      const template = BOAT_TEMPLATES[key]

      it('has a label', () => {
        expect(template.label).toBeTruthy()
      })

      it('has an emoji', () => {
        expect(template.emoji).toBeTruthy()
      })

      it('has at least 3 standard equipment items', () => {
        expect(template.standardEquipment.length)
          .toBeGreaterThanOrEqual(3)
      })

      it('has standard rules', () => {
        expect(template.standardRules.length)
          .toBeGreaterThan(0)
      })

      it('has standard dos', () => {
        expect(template.standardDos.length)
          .toBeGreaterThan(0)
      })

      it('has standard donts', () => {
        expect(template.standardDonts.length)
          .toBeGreaterThan(0)
      })

      it('has what to bring items', () => {
        expect(template.whatToBring.length)
          .toBeGreaterThan(0)
      })

      it('has what not to bring items', () => {
        expect(template.whatNotToBring.length)
          .toBeGreaterThan(0)
      })

      it('has safety points', () => {
        expect(template.safetyPoints.length)
          .toBeGreaterThan(0)
      })

      it('has waiver template with minimum 100 chars', () => {
        expect(template.waiverTemplate.length)
          .toBeGreaterThan(100)
      })

      it('has suggested addons', () => {
        expect(template.suggestedAddons.length)
          .toBeGreaterThan(0)
      })

      it('each suggested addon has required fields', () => {
        template.suggestedAddons.forEach(addon => {
          expect(addon.name).toBeTruthy()
          expect(addon.emoji).toBeTruthy()
          expect(addon.suggestedPrice).toBeGreaterThan(0)
        })
      })
    })
  })
})

describe('getBoatTemplate', () => {
  it('returns correct template for fishing_charter', () => {
    const t = getBoatTemplate('fishing_charter')
    expect(t.label).toBe('Fishing Charter')
  })

  it('fishing template has fishing-specific fields', () => {
    const t = getBoatTemplate('fishing_charter')
    const fieldKeys = t.specificFields.map(f => f.key)
    expect(fieldKeys).toContain('fishing_type')
    expect(fieldKeys).toContain('catch_policy')
    expect(fieldKeys).toContain('license_policy')
  })

  it('dive template has cert requirement field', () => {
    const t = getBoatTemplate('snorkel_dive')
    const fieldKeys = t.specificFields.map(f => f.key)
    expect(fieldKeys).toContain('cert_requirement')
  })

  it('motor yacht has gratuity field', () => {
    const t = getBoatTemplate('motor_yacht')
    const fieldKeys = t.specificFields.map(f => f.key)
    expect(fieldKeys).toContain('gratuity_expectation')
  })
})

describe('getDefaultsFromTemplate', () => {
  it('returns whatToBring as string', () => {
    const defaults = getDefaultsFromTemplate('pontoon')
    expect(typeof defaults.whatToBring).toBe('string')
    expect(defaults.whatToBring?.length).toBeGreaterThan(0)
  })

  it('returns waiver text with minimum length', () => {
    const defaults = getDefaultsFromTemplate('motor_yacht')
    expect(defaults.waiverText?.length).toBeGreaterThan(100)
  })

  it('returns safety points as array', () => {
    const defaults = getDefaultsFromTemplate('fishing_charter')
    expect(Array.isArray(defaults.safetyPoints)).toBe(true)
  })
})
```

### COMPLETE TEST FILE: rls-policies.test.ts
```typescript
// apps/web/__tests__/unit/database/rls-policies.test.ts
// Run against local Supabase: npx supabase start
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const anonKey = process.env.SUPABASE_ANON_KEY_LOCAL!
const serviceKey = process.env.SUPABASE_SERVICE_KEY_LOCAL!

describe('RLS Policy Tests', () => {
  let operatorA_client: ReturnType<typeof createClient>
  let operatorB_client: ReturnType<typeof createClient>
  let serviceClient: ReturnType<typeof createClient>
  let operatorAId: string
  let operatorBId: string
  let boatAId: string

  beforeAll(async () => {
    serviceClient = createClient(supabaseUrl, serviceKey)

    // Create two test operators via auth
    const { data: authA } = await serviceClient.auth.admin
      .createUser({
        email: 'test-operator-a@dockpass-test.io',
        password: 'TestPassword123!',
        email_confirm: true,
      })
    operatorAId = authA.user!.id

    const { data: authB } = await serviceClient.auth.admin
      .createUser({
        email: 'test-operator-b@dockpass-test.io',
        password: 'TestPassword123!',
        email_confirm: true,
      })
    operatorBId = authB.user!.id

    // Insert operator records
    await serviceClient.from('operators').insert([
      { id: operatorAId, email: 'test-operator-a@dockpass-test.io',
        full_name: 'Test A', max_boats: 5, is_active: true },
      { id: operatorBId, email: 'test-operator-b@dockpass-test.io',
        full_name: 'Test B', max_boats: 5, is_active: true },
    ])

    // Sign in as operator A
    operatorA_client = createClient(supabaseUrl, anonKey)
    await operatorA_client.auth.signInWithPassword({
      email: 'test-operator-a@dockpass-test.io',
      password: 'TestPassword123!',
    })

    // Sign in as operator B
    operatorB_client = createClient(supabaseUrl, anonKey)
    await operatorB_client.auth.signInWithPassword({
      email: 'test-operator-b@dockpass-test.io',
      password: 'TestPassword123!',
    })

    // Insert a boat for operator A
    const { data: boat } = await serviceClient
      .from('boats')
      .insert({
        operator_id: operatorAId,
        boat_name: 'Test Boat A',
        boat_type: 'motor_yacht',
        charter_type: 'captained',
        max_capacity: 8,
        marina_name: 'Test Marina',
        marina_address: '123 Test St',
        waiver_text: 'a'.repeat(100),
      })
      .select()
      .single()
    boatAId = boat!.id
  })

  it('Operator A can read their own boat', async () => {
    const { data, error } = await operatorA_client
      .from('boats')
      .select('id')
      .eq('id', boatAId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('Operator B CANNOT read Operator A boat', async () => {
    const { data } = await operatorB_client
      .from('boats')
      .select('id')
      .eq('id', boatAId)
    // RLS should return empty, not error
    expect(data).toHaveLength(0)
  })

  it('Operator A can read their own operator record', async () => {
    const { data, error } = await operatorA_client
      .from('operators')
      .select('id')
      .eq('id', operatorAId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('Operator A CANNOT read Operator B record', async () => {
    const { data } = await operatorA_client
      .from('operators')
      .select('id')
      .eq('id', operatorBId)
    expect(data).toHaveLength(0)
  })

  it('Anonymous user cannot read boats', async () => {
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data } = await anonClient
      .from('boats')
      .select('id')
    expect(data).toHaveLength(0)
  })

  it('Anonymous user cannot read guests table', async () => {
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data } = await anonClient
      .from('guests')
      .select('id')
    expect(data).toHaveLength(0)
  })
})
```

### vitest.config.ts
```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Security utils: 100% required
        'lib/security/**': { lines: 100 },
        // Wizard templates: 90% required
        'lib/wizard/**': { lines: 90 },
        // Overall minimum
        lines: 70,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### vitest.setup.ts
```typescript
// apps/web/vitest.setup.ts
import { vi } from 'vitest'

// Mock environment variables for tests
vi.stubEnv('QR_HMAC_SECRET', 'test-secret-32-bytes-minimum-here!!')
vi.stubEnv('TRIP_LINK_SECRET', 'test-link-secret-32-bytes-minimum!!')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
vi.stubEnv('NODE_ENV', 'test')

// Mock server-only module
vi.mock('server-only', () => ({}))
```

---

## PART 5 — FRONTEND CHECKS

### Design System Compliance Checks
```
For each component built in Phase 1 and Phase 2,
verify these DESIGN.md rules are applied:

□ All buttons: height 52px, radius 12px
□ All cards: border 1px #D0E2F3, radius 16px,
  shadow 0 1px 4px rgba(12,68,124,0.08)
□ Primary buttons: background #0C447C
□ Secondary buttons: border 2px solid #0C447C
□ All text: Inter font only
□ No gradients anywhere
□ Body text: 15px, #0D1B2A
□ Label text: 13px, #6B7C93
□ Error text: 12px, #D63B3B
□ AnchorLoader used for ALL loading states
  (no spinners, no skeleton loaders)
□ Min tap target: 44px on all interactive elements
□ Navy #0C447C only for primary actions
□ Coral #E8593C only for destructive/urgent
□ Teal #1D9E75 only for success/confirmed
```

### Mobile Responsiveness Checks
```
Test ALL screens at these breakpoints:
  390px  — iPhone 15 Pro (primary target)
  375px  — iPhone SE
  360px  — Android standard
  768px  — iPad / tablet (secondary)
  1280px — Desktop

For each screen check:
  □ No horizontal scroll at any breakpoint
  □ All tap targets >= 44px on 390px
  □ Form fields do not overflow
  □ Long marina addresses wrap correctly
  □ Language pills wrap to 2 rows on small screens
  □ Wizard progress bar visible on all widths
  □ Step transitions do not cause layout shift
  □ Mapbox map renders at correct height
  □ Photo grid is 2-col on mobile, 4-col desktop
```

### Accessibility Checks (WCAG 2.1 AA)
```
□ All form inputs have associated <label> elements
□ Error messages linked via aria-describedby
□ All icons have aria-label or aria-hidden
□ Focus order is logical (Tab key navigation)
□ Focus indicators are visible (navy outline)
□ AnchorLoader has role="status" aria-label="Loading"
□ Language pills: role="group" with aria-label
□ Drag handles have keyboard instructions
□ Modal/sheet has focus trap
□ Modal/sheet restores focus on close
□ Colour contrast: all text passes 4.5:1 minimum
  - #6B7C93 on white: 4.55:1 ✅ (just passes)
  - #0C447C on white: 7.2:1 ✅
  - white on #0C447C: 7.2:1 ✅
```

### Performance Checks
```
Run Lighthouse on /dashboard/boats/new:
  □ Performance score > 90
  □ FCP < 1.8s
  □ LCP < 2.5s
  □ CLS < 0.1

Specific checks:
  □ boat-templates.ts NOT in client bundle
    (server-only import should prevent this)
    Verify with: npm run build, check bundle output
  □ Mapbox CSS loaded only when map renders
    (dynamic import, not global)
  □ Framer Motion tree-shaken correctly
    (only import what you use from framer-motion)
  □ No unused shadcn/ui components installed
```

---

## PART 6 — COMPLETE AGENT INSTRUCTION

### Migration 002 (run BEFORE building Phase 2)

```
@docs/agents/00-MASTER.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/17-AUDIT.md

TASK: Run database migration 002.
This adds all fields required by the
8-step boat wizard to the boats table.
Must complete before any wizard code is built.

1. CREATE MIGRATION FILE
   Create: supabase/migrations/002_boat_wizard.sql
   
   Content (execute in this exact order):

   -- 1. New columns on boats
   ALTER TABLE boats
     ADD COLUMN IF NOT EXISTS boat_type_key TEXT,
     ADD COLUMN IF NOT EXISTS operating_area TEXT,
     ADD COLUMN IF NOT EXISTS uscg_doc_number TEXT,
     ADD COLUMN IF NOT EXISTS registration_state TEXT,
     ADD COLUMN IF NOT EXISTS captain_license_type TEXT,
     ADD COLUMN IF NOT EXISTS captain_certifications
       TEXT[] DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS selected_equipment
       TEXT[] DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS selected_amenities
       JSONB DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS specific_field_values
       JSONB DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS custom_dos
       TEXT[] DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS custom_donts
       TEXT[] DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS custom_rule_sections
       JSONB DEFAULT '[]',
     ADD COLUMN IF NOT EXISTS what_not_to_bring TEXT,
     ADD COLUMN IF NOT EXISTS safety_points
       JSONB DEFAULT '[]';

   -- 2. New columns on trips
   ALTER TABLE trips
     ADD COLUMN IF NOT EXISTS waiver_snapshot TEXT,
     ADD COLUMN IF NOT EXISTS waiver_hash TEXT,
     ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
     ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
     ADD COLUMN IF NOT EXISTS started_by_captain TEXT,
     ADD COLUMN IF NOT EXISTS guest_count_at_start INT,
     ADD COLUMN IF NOT EXISTS buoy_policy_id TEXT;

   -- 3. New boat_photos table
   CREATE TABLE IF NOT EXISTS boat_photos (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     boat_id       UUID NOT NULL REFERENCES boats(id)
                   ON DELETE CASCADE,
     operator_id   UUID NOT NULL REFERENCES operators(id),
     storage_path  TEXT NOT NULL,
     public_url    TEXT NOT NULL,
     display_order INT NOT NULL DEFAULT 0,
     is_cover      BOOLEAN NOT NULL DEFAULT false,
     file_size     INT,
     width_px      INT,
     height_px     INT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- 4. Indexes
   CREATE INDEX IF NOT EXISTS idx_boat_photos_boat
     ON boat_photos(boat_id, display_order);
   CREATE INDEX IF NOT EXISTS idx_boats_type
     ON boats(boat_type);
   CREATE INDEX IF NOT EXISTS idx_boats_operator_active
     ON boats(operator_id) WHERE is_active = true;
   CREATE INDEX IF NOT EXISTS idx_trips_date_status
     ON trips(trip_date, status);

   -- 5. RLS for new table
   ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "boat_photos_operator_owns"
     ON boat_photos FOR ALL
     USING (auth.uid() = operator_id);

   CREATE POLICY "boat_photos_public_read"
     ON boat_photos FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM boats
         WHERE boats.id = boat_id
         AND boats.is_active = true
       )
     );

   -- 6. RLS for audit_log
   ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "audit_operator_reads_own"
     ON audit_log FOR SELECT
     USING (auth.uid() = operator_id);

2. RUN MIGRATION
   npx supabase db push
   
3. REGENERATE TYPES
   npx supabase gen types typescript --linked
   > apps/web/types/database.ts
   
4. VERIFY
   In Supabase dashboard:
   □ boats table has new columns
   □ trips table has new columns
   □ boat_photos table exists with RLS
   □ audit_log has RLS enabled
   □ types/database.ts updated (new columns visible)

5. UPDATE SEED DATA
   Update supabase/seed.sql:
   Add boat_type_key: 'motor_yacht' to demo boat
   Add safety_points: '[{"id":"sp1","text":
     "Life jackets under bow seats"}]'
   Add selected_equipment: 
     '["Life jackets","VHF radio","First aid kit"]'

Report: tables updated, types regenerated, 
seed updated, any errors encountered.
```

---

### Phase 2 Complete Boat Wizard Build Instruction

```
@docs/agents/00-MASTER.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/17-AUDIT.md
@docs/agents/20-PHASE_AUDIT.md

TASK: Build the complete BoatCheckin 8-step
boat profile wizard. This is Phase 2.
Migration 002 must be complete first.
No scraping — pure manual entry with
intelligent boat-type templates.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — REMOVE SCRAPER COMPLETELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before building anything:

1. Delete if exists:
   apps/web/app/api/dashboard/boats/import/route.ts
   
2. Remove from .env.local:
   APIFY_API_TOKEN (delete this line)
   
3. Remove from env validation
   (lib/config/env.ts):
   Remove APIFY_API_TOKEN from required list

4. The wizard is pure manual entry only.
   No import feature. No scraping.
   No external URL fields in the wizard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — BOAT TEMPLATE SYSTEM (server-only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/lib/wizard/boat-templates.ts
First line MUST be: import 'server-only'

Contains BOAT_TEMPLATES const with all 9
boat types as defined in PHASE_AUDIT.md.
Each template has:
  label, emoji, description
  standardEquipment[], optionalEquipment[]
  amenityGroups[] (title + items with defaults)
  specificFields[] (key, label, type, options)
  standardRules[], standardDos[], standardDonts[]
  whatToBring[], whatNotToBring[]
  safetyPoints[] (with [location] placeholders)
  waiverTemplate (full legal text)
  suggestedAddons[]

Create API route to serve template data:
  apps/web/app/api/dashboard/wizard/template/
    [boatType]/route.ts
  
  GET endpoint:
    1. requireOperator() — auth required
    2. Validate boatType param against enum
    3. Return getBoatTemplate(boatType)
    4. Do NOT import boat-templates on client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART C — WIZARD STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/boats/new/types.ts

WizardData interface with ALL fields for
all 8 steps as defined in PHASE_AUDIT.md.

INITIAL_WIZARD_DATA with empty defaults.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART D — WIZARD CONTAINER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/boats/new/
  BoatWizard.tsx ('use client')

8-step wizard with:
  Progress bar (fills as steps complete)
  Step header with label
  Back button (step 2+)
  Framer Motion step transitions
  State management with useState
  goNext(partialData) / goBack() functions
  
When boat type selected in Step 1:
  Fetch template from API route
  Show AnchorLoader briefly
  Merge defaults into wizard data
  User sees pre-filled steps 4-7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART E — STEP 1: VESSEL BASICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step1Vessel.tsx ('use client')

Boat type selector: 9 cards in 3×3 grid
Each card: emoji (32px) + label + description
Selected: 2px navy border + #E8F2FB bg
On select: fetch template, pre-fill data

After type selected, form expands:
  Boat name * (text)
  Charter type * (3 radio cards)
  Max passengers * (number 1-500)
  Vessel length ft (number, optional)
  Year built (number 1950-2026, optional)
  
  USCG section (collapsible):
    Documentation number
    Registration state (US states select)

Type-specific info banner:
  Fishing: "License info covered in Step 4"
  Sailing: "Cert requirements in Step 4"
  Dive: "Diver certifications in Step 4"

Validation with Zod before Next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART F — STEP 2: MARINA & DOCK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step2Marina.tsx ('use client')
Create: components/shared/LocationPicker.tsx ('use client')

Fields:
  Marina name *
  Full address *
  Slip or dock number (optional)
  Parking instructions (textarea)
  Operating area (textarea, 2 rows)
    Placeholder varies by boat type

Mapbox LocationPicker component:
  400px height map
  Default: Miami (25.7617, -80.1918)
  On address blur: geocode with Mapbox API
  Place draggable navy marker
  Show: "📍 Location set" when lat/lng exist
  Amber warning if no location (non-blocking)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART G — STEP 3: CAPTAIN PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step3Captain.tsx ('use client')
Create: components/shared/CircularPhotoUpload.tsx

Fields:
  CircularPhotoUpload (80px, dashed border)
    Validates: MIME type + magic bytes client-side
    Preview in circle immediately on select
    File stored in state, uploaded at wizard end
    
  Captain name *
  USCG license number (with "Recommended" badge)
  License type (select, 5 options)
  Years experience (select 1-20+)
  
  Languages (pill multi-select):
    6 languages, English pre-selected
    Min 1 required
  
  Certifications (toggle chips):
    CPR/First Aid, Swift Water Rescue,
    USCG Safety Instructor, PADI Divemaster,
    ASA Instructor, FL Safety Instructor
  
  Trip count (number, optional)
  Average rating (number 1-5, optional)
  
  Bio (textarea, 300 char limit)
    Live counter, turns coral < 20 remaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART H — STEP 4: EQUIPMENT & AMENITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step4Equipment.tsx ('use client')
Create: components/wizard/AmenityToggle.tsx
Create: components/wizard/SpecificField.tsx

All content driven by selected boat type template.

Section 1 — Standard equipment:
  Pre-checked list from template
  Uncheck = amber warning shown
  
Section 2 — Optional equipment:
  Unchecked list from template
  Check = added to equipment list
  
Section 3 — Amenity groups:
  Rendered from template.amenityGroups
  Toggle switches per amenity
  Pre-set from template defaults
  
Section 4 — Boat-specific fields:
  Rendered from template.specificFields
  SpecificField component handles all types:
    select, multiselect, text, number, boolean
  Required fields enforced
  
Section 5 — Custom details:
  [+ Add custom detail] button
  Inline form: label + value
  Unlimited items
  Displayed as key-value pairs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART I — STEP 5: RULES & CONDUCT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step5Rules.tsx ('use client')
Create: components/wizard/SortableRuleList.tsx
  (uses @dnd-kit/sortable)

Three tabs: House Rules | DOs ✓ | DON'Ts ✗
  (Single column on mobile, tabs on desktop)

Each section:
  Pre-loaded from template
  Each item: drag handle + text + edit + delete
  Edit inline on click
  [+ Add item] at bottom
  Drag to reorder (@dnd-kit keyboard accessible)

Custom rule sections below:
  [+ Add section] button
  Section title + display type selector:
    • Bullet / 1. Numbered / ☑ Checklist
  Same drag-to-reorder pattern
  Delete entire section with confirm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART J — STEP 6: PACKING GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step6Packing.tsx ('use client')

Two sections side by side (desktop):

What to Bring:
  Textarea, one item per line
  Pre-loaded from template
  Live preview toggle (shows as checklist)

What NOT to Bring:
  Same pattern
  Pre-loaded from template
  Live preview shows ✗ coral prefix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART K — STEP 7: SAFETY & WAIVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step7Safety.tsx ('use client')

SAFETY BRIEFING CARDS:
  Pre-loaded from template.safetyPoints
  Items with [location] placeholder:
    Show inline text input on click
    "Life jackets are located ___"
    Fill in, saves as complete text
  
  Each card: drag + edit + delete
  [+ Add safety point]
  
  Preview card (exact mobile appearance)

LIABILITY WAIVER:
  Disclaimer banner (amber, non-dismissable)
  Tall textarea pre-loaded from template
  [Edit] / [Preview] tabs
    Preview renders formatted text
    Shows example signature
  
  Standard clauses panel (collapsible):
    Chips to append standard clauses:
    [+ Medical conditions]
    [+ Weather cancellation]
    [+ Photography release]
    [+ Minor passengers]
    [+ Alcohol liability]
    Each appends pre-written legal text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART L — STEP 8: PHOTOS & ADD-ONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: steps/Step8Photos.tsx ('use client')
Create: components/wizard/PhotoGrid.tsx
Create: components/wizard/AddonEditor.tsx

PHOTOS:
  Upload directly to Supabase Storage
  (browser client — NOT via Server Action)
  Path: boat-photos/{operatorId}/boats/{uuid}
  
  Max 12 photos, 5MB each
  Validate magic bytes client-side first
  Use sharp on server for resize (if processing)
  
  4-col grid (2-col mobile)
  Drag to reorder with @dnd-kit
  First photo = cover photo (badge shown)
  Delete: hover overlay with 🗑️

ADD-ONS:
  Suggested from template shown as cards
  [Add to menu] moves to active list
  
  Active list:
    Emoji picker | Name | Desc | Price | Qty | Remove
  Price in dollars, stored as cents
  
  [+ Add custom item]
  [Skip for now] ghost link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART M — SAVE & COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/dashboard/boats/new/
  actions.ts
import 'server-only'

saveBoatProfile Server Action:
  1. requireOperator()
  2. Validate with boatSetupSchema (Zod)
  3. Captain photo: already uploaded to Storage
     Just save the URL
  4. INSERT into boats with ALL new columns:
     - All wizard data mapped to columns
     - specific_field_values as JSONB
     - selected_amenities as JSONB
     - custom_rule_sections as JSONB
     - safety_points as JSONB array
     - selected_equipment as TEXT[]
     - custom_dos as TEXT[]
     - custom_donts as TEXT[]
  5. INSERT boat_photos records in order
     (display_order = array index)
     Mark first as is_cover = true
  6. INSERT addons (if any)
  7. auditLog({ action: 'boat_created', ... })
  8. return { boatId }

Create: steps/StepComplete.tsx
  Navy background
  White ⚓ static anchor (48px)
  "[Boat name] is ready!"
  What happens next (3 steps)
  [Create my first trip →] → /dashboard/trips/new

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART N — SHARED WIZARD COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create these shared components:

components/ui/WizardField.tsx
  Props: label, required?, helper?, error?
  Consistent spacing: 16px between fields

components/ui/ContinueButton.tsx
  Full width, 52px, navy, radius 12px
  Loading: AnchorLoader replacing text
  Disabled: 40% opacity

components/ui/RadioCard.tsx
  Selection card with icon, title, body
  Selected: navy border + #E8F2FB bg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART O — P1 FIX: PASSWORD RESET PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Also fix the Phase 1 gap found in audit:

Create: apps/web/app/auth/reset-password/
  page.tsx ('use client')

Reads: URL hash access_token
Form: New password + confirm password
On submit: supabase.auth.updateUser({ password })
Success: redirect /login?message=password_reset
Error: show message, link to /forgot-password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 1 — Scraper removed:
  Verify no APIFY reference in any file
  Verify /api/dashboard/boats/import does not exist

TEST 2 — Template loads server-only:
  Run: npm run build
  Check bundle analysis:
  boat-templates.ts should NOT appear in
  any client bundle (server-only import)

TEST 3 — Boat type switching:
  Select Fishing Charter → Step 4
  Verify fishing-specific fields shown
  Go back, select Motor Yacht
  Verify gratuity field shows, catch policy gone

TEST 4 — Rules drag reorder:
  In Step 5 drag rule 1 to position 3
  Click Continue → Back
  Rule should remain in new position
  (state preserved correctly)

TEST 5 — Safety [location] placeholder:
  In Step 7 click on card with [location]
  Type "under the bow seats"
  Text should update to full sentence

TEST 6 — Photo upload direct to Supabase:
  Upload 3 photos in Step 8
  Before submitting wizard: check Supabase
  storage — photos should be there already
  (uploaded directly, not via Server Action)

TEST 7 — Complete end-to-end:
  Complete all 8 steps
  Click Save
  Verify in Supabase:
    boats: new row with all columns filled
    boat_photos: 3 rows with display_order
    addons: rows if added
    audit_log: 'boat_created' entry

TEST 8 — Password reset flow:
  Request reset for test account
  Check Resend dashboard for email
  Click link → should land on reset page
  Enter new password → redirect to login

TEST 9 — Run unit tests:
  npm run test → all tests pass

TEST 10 — Build:
  npm run typecheck → zero errors
  npm run build → zero errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 10 tests pass, report:
  1. All files created (full paths)
  2. All tests pass/fail
  3. Migration 002 rows confirmed
  4. bundle-analysis: boat-templates.ts
     confirmed NOT in client bundle
  5. Any deviations from spec + why
  6. Total line count added
```

---

## PART 7 — EXECUTION ORDER

```
Run in this exact sequence:

STEP 1 (now):
  Run migration 002
  Regenerate types
  Verify new columns exist

STEP 2 (after migration):
  Run the Phase 2 complete build instruction
  above (Part 6)

STEP 3 (after build):
  Run the backend test suite
  npm run test

STEP 4 (after tests):
  Run Lighthouse on /dashboard/boats/new
  Fix any performance issues

STEP 5 (after all green):
  Commit: "feat: boat wizard 8-step complete"
  Move to Phase 3: Trip Creation
```
