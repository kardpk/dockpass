-- =============================================
-- Migration 028: Self-Drive Foundation (Phase 4A)
--
-- Adds:
--   1. trip_type + requires_qualification on trips
--   2. Self-drive requirement columns on boats
--   3. guest_qualifications table (attestation record)
--
-- Reference: RESORT_FLEET_ARCHITECTURE.md Part 4.1 + 4.2
-- =============================================


-- ─────────────────────────────────────────────
-- 1. TRIPS — add trip_type and requires_qualification
-- ─────────────────────────────────────────────

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS trip_type TEXT NOT NULL DEFAULT 'captained'
    CHECK (trip_type IN ('captained', 'self_drive', 'bareboat')),
  ADD COLUMN IF NOT EXISTS requires_qualification BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_trips_type
  ON trips(operator_id, trip_type);

COMMENT ON COLUMN trips.trip_type IS
  'Determines guest check-in flow: captained = standard flow, self_drive = adds qualification attestation step.';

COMMENT ON COLUMN trips.requires_qualification IS
  'Trip-level override: force qualification step regardless of boat-level setting.';


-- ─────────────────────────────────────────────
-- 2. BOATS — add self-drive requirement fields
-- ─────────────────────────────────────────────

ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS requires_qualification  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_boater_card    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_experience_years    INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_boat_ownership BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qualification_notes     TEXT;

COMMENT ON COLUMN boats.requires_qualification IS
  'Default for all trips on this boat: guests must complete qualification attestation.';
COMMENT ON COLUMN boats.requires_boater_card IS
  'Florida livery F.S. §327.54: requires Safe Boater Education Card for guests born after 1988.';
COMMENT ON COLUMN boats.min_experience_years IS
  'Minimum boating experience years required. 0 = no minimum.';
COMMENT ON COLUMN boats.requires_boat_ownership IS
  'Whether prior boat ownership is required (standard for Captain Pip''s-style operators).';
COMMENT ON COLUMN boats.qualification_notes IS
  'Optional operator-written note shown to guest during qualification step.';


-- ─────────────────────────────────────────────
-- 3. GUEST_QUALIFICATIONS TABLE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guest_qualifications (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id                  UUID NOT NULL REFERENCES guests(id)    ON DELETE CASCADE,
  trip_id                   UUID NOT NULL REFERENCES trips(id)     ON DELETE CASCADE,
  operator_id               UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

  -- Experience attestation
  has_boat_ownership        BOOLEAN NOT NULL DEFAULT false,
  ownership_years           INT,
  ownership_vessel_type     TEXT,  -- 'center_console','pontoon','sailboat','other'
  experience_years          INT    NOT NULL DEFAULT 0,
  experience_description    TEXT,

  -- Safe Boater Card (FL F.S. §327.54 — born after 1988)
  safe_boater_required      BOOLEAN NOT NULL DEFAULT false,
  safe_boater_card_url      TEXT,   -- Supabase Storage path in guest-documents bucket
  safe_boater_card_state    TEXT,
  safe_boater_card_number   TEXT,

  -- Attestation audit record (ESIGN-comparable)
  attested_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attestation_ip            TEXT        NOT NULL DEFAULT 'unknown',
  attestation_user_agent    TEXT        NOT NULL DEFAULT 'unknown',
  attestation_hash          TEXT        NOT NULL,  -- SHA-256 of all fields + timestamp + IP

  -- Operator review workflow
  qualification_status      TEXT NOT NULL DEFAULT 'pending'
                            CHECK (qualification_status IN
                            ('pending', 'approved', 'flagged', 'rejected')),
  reviewed_by_staff         BOOLEAN NOT NULL DEFAULT false,
  reviewed_at               TIMESTAMPTZ,
  review_notes              TEXT,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One qualification record per guest per trip (upsert-safe)
CREATE UNIQUE INDEX IF NOT EXISTS guest_qualifications_guest_trip_idx
  ON guest_qualifications(guest_id, trip_id);

CREATE INDEX IF NOT EXISTS idx_qualifications_trip
  ON guest_qualifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_operator
  ON guest_qualifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_status
  ON guest_qualifications(qualification_status);

-- ─────────────────────────────────────────────
-- 3a. RLS on guest_qualifications
-- ─────────────────────────────────────────────

ALTER TABLE guest_qualifications ENABLE ROW LEVEL SECURITY;

-- Operators read their own records
DROP POLICY IF EXISTS "qualifications_operator_reads" ON guest_qualifications;
CREATE POLICY "qualifications_operator_reads" ON guest_qualifications
  FOR SELECT USING (auth.uid() = operator_id);

-- Operators update review status (approve/flag/reject)
DROP POLICY IF EXISTS "qualifications_operator_updates" ON guest_qualifications;
CREATE POLICY "qualifications_operator_updates" ON guest_qualifications
  FOR UPDATE USING (auth.uid() = operator_id);

-- Service role (API routes) has full access — bypasses RLS automatically
-- No explicit policy needed for service role.

COMMENT ON TABLE guest_qualifications IS
  'Self-drive experience attestation per guest per trip. SHA-256 hashed, IP-attributed, ESIGN-comparable audit record. Operator can approve/flag/reject.';
