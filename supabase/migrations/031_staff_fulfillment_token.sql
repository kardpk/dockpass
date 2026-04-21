-- =============================================
-- Migration 031: Staff Fulfillment Token & PIN
-- =============================================
-- Adds fulfillment_min + fulfillment_token to operators
-- so dock staff can view the fulfillment board via a
-- PIN-protected link without a full operator login.
--
-- Reference: RESORT_FLEET_ARCHITECTURE.md §6.3
--   "Can be accessed without full operator login via a
--    PIN-protected staff link (no PII visible)"

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS fulfillment_pin       TEXT,           -- bcrypt-hashed 4-digit PIN
  ADD COLUMN IF NOT EXISTS fulfillment_token     TEXT,           -- opaque 32-char URL token
  ADD COLUMN IF NOT EXISTS fulfillment_token_expires TIMESTAMPTZ; -- optional expiry

-- Index for fast lookup by token on the public staff board route
CREATE INDEX IF NOT EXISTS idx_operators_fulfillment_token
  ON operators(fulfillment_token)
  WHERE fulfillment_token IS NOT NULL;
