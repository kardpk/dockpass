-- =============================================
-- Migration 017: Captain Roster & Trip Assignment
--
-- Introduces per-trip captain assignment to solve
-- the Operator ≠ Captain delegation problem.
--
-- New tables:
--   captains         — operator's captain roster
--   trip_assignments  — per-trip captain/crew link
--
-- New columns on trips:
--   captain_notes, head_count_confirmed, head_count_confirmed_at
-- =============================================

-- ─────────────────────────────────────────────
-- 1. CAPTAINS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captains (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id       UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

  -- Profile
  full_name         TEXT NOT NULL,
  photo_url         TEXT,
  bio               TEXT,
  phone             TEXT,
  email             TEXT,

  -- Credentials (USCG)
  license_number    TEXT,
  license_type      TEXT
                    CHECK (license_type IS NULL OR license_type IN (
                      'OUPV', 'Master 25 Ton', 'Master 50 Ton',
                      'Master 100 Ton', 'Master 200 Ton', 'Master Unlimited',
                      'Able Seaman', 'Other'
                    )),
  license_expiry    DATE,

  -- Metadata
  languages         TEXT[] DEFAULT '{"en"}',
  years_experience  INT,
  certifications    TEXT[] DEFAULT '{}',

  -- Status
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_default        BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique email per operator (only when email is set)
CREATE UNIQUE INDEX IF NOT EXISTS captains_operator_email_idx
  ON captains (operator_id, email) WHERE email IS NOT NULL;


-- ─────────────────────────────────────────────
-- 2. TRIP ASSIGNMENTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  captain_id        UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  operator_id       UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

  role              TEXT NOT NULL DEFAULT 'captain'
                    CHECK (role IN ('captain', 'first_mate', 'crew', 'deckhand')),

  -- Audit
  assigned_by       TEXT,
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate captain on same trip
  UNIQUE (trip_id, captain_id)
);


-- ─────────────────────────────────────────────
-- 3. NEW COLUMNS ON TRIPS
-- ─────────────────────────────────────────────
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS captain_notes            TEXT,
  ADD COLUMN IF NOT EXISTS head_count_confirmed     INT,
  ADD COLUMN IF NOT EXISTS head_count_confirmed_at  TIMESTAMPTZ;


-- ─────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_captains_operator
  ON captains(operator_id);
CREATE INDEX IF NOT EXISTS idx_captains_active
  ON captains(operator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_trip
  ON trip_assignments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_captain
  ON trip_assignments(captain_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_operator
  ON trip_assignments(operator_id);


-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_assignments ENABLE ROW LEVEL SECURITY;

-- Captains: operator sees their own roster
DROP POLICY IF EXISTS "captains_operator_manages" ON captains;
CREATE POLICY "captains_operator_manages" ON captains
  FOR ALL USING (auth.uid() = operator_id);

-- Trip assignments: operator sees their assignments
DROP POLICY IF EXISTS "trip_assignments_operator_manages" ON trip_assignments;
CREATE POLICY "trip_assignments_operator_manages" ON trip_assignments
  FOR ALL USING (auth.uid() = operator_id);


-- ─────────────────────────────────────────────
-- 6. AUTO-UPDATE TRIGGER
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS captains_updated_at ON captains;
CREATE TRIGGER captains_updated_at
  BEFORE UPDATE ON captains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────
-- 7. DATA MIGRATION
-- Copy existing boats.captain_* into captains table
-- Creates one captain per distinct (operator_id, captain_name)
-- ─────────────────────────────────────────────
INSERT INTO captains (
  operator_id, full_name, photo_url, bio,
  license_number, languages, years_experience,
  is_default
)
SELECT DISTINCT ON (b.operator_id, b.captain_name)
  b.operator_id,
  b.captain_name,
  b.captain_photo_url,
  b.captain_bio,
  b.captain_license,
  COALESCE(b.captain_languages, '{"en"}'),
  b.captain_years_exp,
  true
FROM boats b
WHERE b.captain_name IS NOT NULL
  AND b.captain_name <> ''
  AND b.is_active = true
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────
-- 8. COMMENTS
-- ─────────────────────────────────────────────
COMMENT ON TABLE captains IS
  'Captain roster managed by operators. Decouples captain identity from boat profile for per-trip assignment.';

COMMENT ON TABLE trip_assignments IS
  'Per-trip captain/crew assignment. Enables fleet rotation and accurate USCG manifest logging.';

COMMENT ON COLUMN trips.captain_notes IS
  'Free-text trip log entered by captain via Snapshot View: weather, incidents, fuel usage, observations.';

COMMENT ON COLUMN trips.head_count_confirmed IS
  'Physical head count entered by captain before departure. Compared against digital guest count for discrepancy detection.';

COMMENT ON COLUMN trips.head_count_confirmed_at IS
  'UTC timestamp when captain confirmed the physical head count.';
