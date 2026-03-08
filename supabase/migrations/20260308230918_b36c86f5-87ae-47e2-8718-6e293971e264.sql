ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height_cm numeric NULL,
  ADD COLUMN IF NOT EXISTS birth_date date NULL,
  ADD COLUMN IF NOT EXISTS gender text NULL DEFAULT 'male';