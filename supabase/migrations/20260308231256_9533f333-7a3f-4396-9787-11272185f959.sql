ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activity_level text NULL DEFAULT 'moderate';