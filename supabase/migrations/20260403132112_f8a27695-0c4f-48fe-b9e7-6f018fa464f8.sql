
ALTER TABLE public.assigned_supplements
  ADD COLUMN IF NOT EXISTS dosage text,
  ADD COLUMN IF NOT EXISTS timing text NOT NULL DEFAULT 'Sabah',
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '💊',
  ADD COLUMN IF NOT EXISTS servings_left integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS total_servings integer NOT NULL DEFAULT 30;
