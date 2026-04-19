-- ==========================================
-- Migration 024: Short Board Token
--
-- Adds short_board_token to boats — a human-readable slug used in
-- the short boarding URL: boatcheckin.com/b/[short_board_token]
--
-- Format: slugify(boat_name, max 24 chars) + '-' + sha256(boat_id)[0:4]
-- Example: "mv-lotus-a3f9"
--
-- Generation is app-side (JS slugify) via:
--   lib/utils/shortBoardToken.ts → generateShortBoardToken(boatId, boatName)
--
-- Backfill existing boats via:
--   POST /api/internal/backfill-short-tokens  (with x-internal-secret header)
--
-- Old /board/[public_slug] URLs remain fully functional — this adds
-- a second, friendlier entry point that 307-redirects to the full URL.
-- ==========================================

BEGIN;

-- 1. Add column (nullable — backfill runs app-side after migration)
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS short_board_token TEXT;

-- 2. Unique index — allows NULL (partial uniqueness on non-null values)
--    Using index rather than constraint so backfill retries don't choke on partial state
CREATE UNIQUE INDEX IF NOT EXISTS idx_boats_short_board_token
  ON boats (short_board_token)
  WHERE short_board_token IS NOT NULL;

-- 3. Fast lookup index for /b/[short] redirect route
CREATE INDEX IF NOT EXISTS idx_boats_short_token_active
  ON boats (short_board_token)
  WHERE is_active = true AND short_board_token IS NOT NULL;

COMMIT;

-- ── Post-migration steps (run in order after deploy) ────────────────────────
--
-- Step 1: Apply this migration in Supabase dashboard or CLI
-- Step 2: Deploy the app (new code that generates tokens on boat creation)
-- Step 3: Call the backfill endpoint once:
--   curl -X POST https://boatcheckin.com/api/internal/backfill-short-tokens \
--        -H "x-internal-secret: $INTERNAL_SECRET"
--
-- Verify: SELECT short_board_token, boat_name FROM boats LIMIT 10;
--         SELECT COUNT(*) FROM boats WHERE short_board_token IS NULL; → 0
