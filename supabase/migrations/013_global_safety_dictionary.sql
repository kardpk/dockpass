-- ==========================================
-- Migration 013: Global Safety Dictionary + is_admin flag
--
-- 1. Add is_admin boolean to operators for flexible admin gating
-- 2. Create global_safety_dictionary for multilingual pre-recorded audio
-- 3. RLS: public read, admin-only write
-- ==========================================

-- ── 1. Add is_admin to operators ──────────────────────────────────────────────
ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.operators.is_admin IS
  'Admin flag for platform-wide management (safety dictionary, global settings). Set manually via SQL.';

-- ── 2. Create global_safety_dictionary ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_safety_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Composite key: one row per topic per language
  topic_key TEXT NOT NULL,            -- matches SafetyCard.topic_key (e.g. 'life_jackets')
  language_code TEXT NOT NULL,        -- ISO 639-1 (e.g. 'en', 'es', 'ar')

  -- Content
  title TEXT NOT NULL,                -- localized topic name
  instructions TEXT NOT NULL,         -- localized safety instructions (legal-grade)
  audio_url TEXT,                     -- Supabase Storage URL to pre-recorded MP3/M4A
  emoji TEXT,                         -- display emoji (nullable, falls back to types.ts)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(topic_key, language_code)
);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.global_safety_dictionary ENABLE ROW LEVEL SECURITY;

-- Anyone can read (guests need this without authentication)
CREATE POLICY "Anyone can read safety dictionary"
  ON public.global_safety_dictionary
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage safety dictionary"
  ON public.global_safety_dictionary
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.operators
      WHERE operators.id = auth.uid()
        AND operators.is_admin = true
    )
  );

-- ── 4. Performance index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_safety_dict_topic_lang
  ON public.global_safety_dictionary (topic_key, language_code);

-- ── 5. Documentation ──────────────────────────────────────────────────────────
COMMENT ON TABLE public.global_safety_dictionary IS
  'Admin-managed multilingual safety topic translations with pre-recorded audio URLs. Joined at guest render time via topic_key + language_code. Storage: safety-audio bucket.';
