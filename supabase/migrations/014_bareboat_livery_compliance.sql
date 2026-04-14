-- ==========================================
-- 014: Bareboat/Livery Compliance (FWC Ch.327)
--
-- Adds support for bareboat/livery compliance:
--   1. New approval_status: 'pending_livery_briefing'
--   2. FWC Boater Safety ID photo URL
--   3. Livery briefing verification tracking
-- ==========================================

-- 1. Expand approval_status CHECK constraint
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_approval_status_check;
ALTER TABLE guests ADD CONSTRAINT guests_approval_status_check
  CHECK (approval_status IN (
    'pending', 'approved', 'declined', 'auto_approved',
    'pending_livery_briefing'
  ));

-- 2. FWC license photo URL (uploaded by guest)
ALTER TABLE guests ADD COLUMN IF NOT EXISTS fwc_license_url TEXT;

-- 3. Livery briefing verification (set by dockmaster/operator)
ALTER TABLE guests ADD COLUMN IF NOT EXISTS livery_briefing_verified_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS livery_briefing_verified_by TEXT;

-- 4. Index for quick livery briefing lookups on trip detail
CREATE INDEX IF NOT EXISTS idx_guests_livery_pending
  ON guests(trip_id) WHERE approval_status = 'pending_livery_briefing';
