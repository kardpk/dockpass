-- ==========================================
-- 016: State Compliance & PWC Boat Type
--
-- Phase 2: Western Expansion (TX & CA)
--   1. Add state_code to boats (defaults to 'FL')
--   2. Expand boat_type CHECK to include 'pwc'
--
-- NOTE: boat_type values were remapped in 002_phase2_boat_types.sql
--   yacht → motor_yacht, fishing → fishing_charter,
--   sailboat → sailing_yacht, + sunset_cruise, snorkel_dive
-- ==========================================

-- 1. State code for compliance rules engine
ALTER TABLE boats ADD COLUMN IF NOT EXISTS state_code CHAR(2) DEFAULT 'FL';

-- 2. Expand boat_type CHECK constraint to include PWC
ALTER TABLE boats DROP CONSTRAINT IF EXISTS boats_boat_type_check;
ALTER TABLE boats ADD CONSTRAINT boats_boat_type_check
  CHECK (boat_type IN (
    'motor_yacht', 'fishing_charter', 'catamaran',
    'pontoon', 'snorkel_dive', 'sailing_yacht',
    'speedboat', 'sunset_cruise', 'pwc', 'other'
  ));

-- 3. Index for state-based compliance lookups
CREATE INDEX IF NOT EXISTS idx_boats_state_code ON boats(state_code);
