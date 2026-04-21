-- ============================================================
-- Migration 033 — Addons: add is_active column
-- Root cause fix: getTripPageData and addons CRUD API both
-- reference is_active on the addons table, but the original
-- schema (001) only created is_available.
-- This migration adds is_active (synced from is_available)
-- and keeps both columns consistent going forward.
-- ============================================================

-- ==========================================
-- ALTER: addons — add is_active (canonical active flag)
-- ==========================================
-- Add is_active column. Default true — same default as is_available.
-- Using ADD COLUMN IF NOT EXISTS so this is safe to run multiple times.
ALTER TABLE addons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Sync existing rows: set is_active from is_available
UPDATE addons
  SET is_active = is_available
  WHERE is_active IS DISTINCT FROM is_available;

-- ==========================================
-- INDEX: fast active-addon queries
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_addons_active
  ON addons(boat_id, is_active)
  WHERE is_active = true;

-- ==========================================
-- POLICY: update addons_public_read to use is_active
-- (is_available is legacy — keep policy consistent with new column)
-- ==========================================
DROP POLICY IF EXISTS "addons_public_read" ON addons;
CREATE POLICY "addons_public_read" ON addons
  FOR SELECT USING (is_active = true);
