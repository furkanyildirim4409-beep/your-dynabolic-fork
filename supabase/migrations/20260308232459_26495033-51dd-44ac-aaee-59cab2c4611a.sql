ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_calorie_target integer NULL;