-- ============================================================================
-- 018_trip_purpose.sql
-- Trip Purpose Classification & Compliance Profiles
-- 
-- Adds trip_purpose column to allow operators to classify trips as
-- commercial, private, family, fishing, corporate, training, or other.
-- Each purpose maps to a ComplianceProfile that controls waiver/safety
-- enforcement in the application layer.
-- ============================================================================

-- ── Step 1: Add trip_purpose column ──────────────────────────────────────────
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS trip_purpose TEXT NOT NULL DEFAULT 'commercial'
  CHECK (trip_purpose IN (
    'commercial',       -- Paying customers, full USCG compliance
    'private_party',    -- Friends/social gathering, no payment
    'family',           -- Family day out, minimal compliance
    'fishing_social',   -- Fishing with buddies, fuel-share
    'corporate',        -- Corporate event, client entertainment
    'training',         -- Crew training, delivery, repositioning
    'other'             -- Catch-all
  ));

-- ── Step 2: Compliance override flag ─────────────────────────────────────────
-- Allows cautious operators to force full compliance even on private trips
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS force_full_compliance BOOLEAN NOT NULL DEFAULT false;

-- ── Step 3: Fuel-sharing disclaimer acknowledgment ───────────────────────────
-- For fishing_social trips: operator confirms they are ONLY sharing costs,
-- NOT accepting "consideration" that would trigger USCG for-hire rules
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS fuel_share_disclaimer_accepted BOOLEAN DEFAULT false;

-- ── Step 4: Mid-trip reclassification tracking ───────────────────────────────
-- When an operator upgrades from private → commercial mid-trip
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS reclassified_from TEXT DEFAULT NULL;

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS reclassified_at TIMESTAMPTZ DEFAULT NULL;

-- ── Step 5: Indexes ──────────────────────────────────────────────────────────
-- Dashboard filtering by purpose
CREATE INDEX IF NOT EXISTS idx_trips_purpose 
  ON trips (operator_id, trip_purpose);

-- ── Step 6: Comment ──────────────────────────────────────────────────────────
COMMENT ON COLUMN trips.trip_purpose IS 
  'Classifies the trip for compliance rule selection. commercial = full USCG stack. private_party/family = relaxed. Derived ComplianceProfile in app layer.';
COMMENT ON COLUMN trips.force_full_compliance IS 
  'Operator override: forces full USCG compliance regardless of trip_purpose.';
COMMENT ON COLUMN trips.fuel_share_disclaimer_accepted IS 
  'For fishing_social: operator confirms no "consideration" beyond shared expenses.';
COMMENT ON COLUMN trips.reclassified_from IS 
  'Previous trip_purpose before mid-trip reclassification.';
