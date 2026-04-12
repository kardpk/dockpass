-- ==========================================
-- Migration 012: Safety cards column defaults & documentation
-- NOTE: 011 already created the column as safety_cards (or safety_images
-- was renamed in the SQL editor). This migration is idempotent.
-- ==========================================

-- 1. Ensure safety_cards column exists with correct default
-- (Column may have been created as safety_images or safety_cards by 011)
DO $$
BEGIN
  -- If safety_images exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'safety_images'
  ) THEN
    ALTER TABLE public.boats RENAME COLUMN safety_images TO safety_cards;
  END IF;

  -- If safety_cards doesn't exist at all, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boats'
      AND column_name = 'safety_cards'
  ) THEN
    ALTER TABLE public.boats ADD COLUMN safety_cards JSONB DEFAULT '[]';
  END IF;
END $$;

-- 2. Ensure default is set
ALTER TABLE public.boats
  ALTER COLUMN safety_cards SET DEFAULT '[]';

-- 3. Add documentation
COMMENT ON COLUMN public.boats.safety_cards IS
  'JSONB array of SafetyCard objects with topic_key for USCG 46 CFR compliance. Structure: [{id, topic_key, url, custom_title?, instructions, sort_order}]';

COMMENT ON COLUMN public.boats.firma_template_id IS
  'Firma.dev template ID for the digital liability waiver PDF with signature field placement';
