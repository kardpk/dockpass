-- ═══════════════════════════════════════════════════════════════════
-- Migration 019: Pre-Departure Safety Briefing Gate
-- ═══════════════════════════════════════════════════════════════════
--
-- Legal basis: 46 CFR §185.506 — Safety orientation for passengers
-- The master must ensure all passengers receive a verbal safety
-- orientation covering emergency exits, life jacket location,
-- donning procedure, instruction placards, hazardous conditions,
-- and reduced manning. This migration adds the attestation columns
-- that prove the captain delivered this briefing.
--
-- This creates a legally defensible audit trail for BoatCheckin:
--   "Captain [name] confirmed at [timestamp] that they verbally
--    briefed [N] passengers on [specific topics] before departure."
-- ═══════════════════════════════════════════════════════════════════

-- Timestamp when captain confirmed the verbal safety briefing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS
  safety_briefing_confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Captain name who confirmed the briefing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS
  safety_briefing_confirmed_by TEXT DEFAULT NULL;

-- JSONB array of specific USCG topics covered
-- e.g. ["emergency_exits","life_jacket_location","life_jacket_donning",
--        "instruction_placards","hazardous_conditions","reduced_manning"]
ALTER TABLE trips ADD COLUMN IF NOT EXISTS
  safety_briefing_topics JSONB DEFAULT NULL;

-- Briefing delivery method:
--   'full_verbal'             – Captain spoke to all passengers
--   'abbreviated_with_cards'  – Cards distributed + abbreviated announcement
--   'pa_announcement'         – PA system (large vessels)
--   'reduced_private'         – Minimal check for private/family trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS
  safety_briefing_type TEXT DEFAULT NULL;

-- Captain's digital attestation signature text
ALTER TABLE trips ADD COLUMN IF NOT EXISTS
  safety_briefing_signature TEXT DEFAULT NULL;

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_trips_briefing_confirmed
  ON trips (safety_briefing_confirmed_at)
  WHERE safety_briefing_confirmed_at IS NOT NULL;

COMMENT ON COLUMN trips.safety_briefing_confirmed_at IS
  '46 CFR §185.506: Timestamp when captain confirmed verbal safety orientation was delivered to all passengers';

COMMENT ON COLUMN trips.safety_briefing_topics IS
  'JSONB array of USCG topic IDs covered in the briefing (e.g. emergency_exits, life_jacket_location)';
