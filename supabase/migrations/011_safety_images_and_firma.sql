-- ==========================================
-- Migration: Add safety_images and firma_template_id to boats
-- Supports Boat Wizard Steps 8 (Safety Images) and 9 (Waiver)
-- ==========================================

-- 1. Add firma_template_id to boats table
--    Stores the Firma.dev template ID created from the operator's PDF waiver
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS firma_template_id TEXT NULL;

-- 2. Add safety_images JSONB column to boats table
--    Stores captain-uploaded safety equipment photos with titles and instructions
--    Structure: [{ id, url, title, instructions, sort_order }]
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS safety_images JSONB DEFAULT '[]';

-- 3. Drop the NOT NULL constraint on waiver_text since we now use Firma PDF
--    (waiver_text becomes a placeholder/fallback)
ALTER TABLE public.boats
  ALTER COLUMN waiver_text DROP NOT NULL;

-- 4. Set default for waiver_text for new rows
ALTER TABLE public.boats
  ALTER COLUMN waiver_text SET DEFAULT '[No waiver configured]';
