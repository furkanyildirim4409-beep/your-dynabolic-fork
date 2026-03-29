
-- Fix the security definer view warning by using security invoker
CREATE OR REPLACE VIEW public.leaderboard_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, xp, streak, total_volume_kg, bio_coins, level, role
FROM public.profiles
WHERE role = 'athlete';
