
-- 1. Fix waitlist: remove broad SELECT, replace with coach-only
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON public.waitlist;

CREATE POLICY "Coaches can view waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coach'::app_role));

-- 2. Fix profiles: add WITH CHECK to coach/team member UPDATE to prevent privilege escalation
-- Drop existing policies and recreate with restrictions
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can update athlete profiles" ON public.profiles;

CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (
  coach_id = auth.uid()
  AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = profiles.id)
  AND subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM public.profiles WHERE id = profiles.id)
  AND subscription_status IS NOT DISTINCT FROM (SELECT subscription_status FROM public.profiles WHERE id = profiles.id)
  AND email IS NOT DISTINCT FROM (SELECT email FROM public.profiles WHERE id = profiles.id)
  AND xp IS NOT DISTINCT FROM (SELECT xp FROM public.profiles WHERE id = profiles.id)
  AND bio_coins IS NOT DISTINCT FROM (SELECT bio_coins FROM public.profiles WHERE id = profiles.id)
  AND level IS NOT DISTINCT FROM (SELECT level FROM public.profiles WHERE id = profiles.id)
);

CREATE POLICY "Team members can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_active_team_member_of(coach_id))
WITH CHECK (
  is_active_team_member_of(coach_id)
  AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = profiles.id)
  AND subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM public.profiles WHERE id = profiles.id)
  AND subscription_status IS NOT DISTINCT FROM (SELECT subscription_status FROM public.profiles WHERE id = profiles.id)
  AND email IS NOT DISTINCT FROM (SELECT email FROM public.profiles WHERE id = profiles.id)
  AND xp IS NOT DISTINCT FROM (SELECT xp FROM public.profiles WHERE id = profiles.id)
  AND bio_coins IS NOT DISTINCT FROM (SELECT bio_coins FROM public.profiles WHERE id = profiles.id)
  AND level IS NOT DISTINCT FROM (SELECT level FROM public.profiles WHERE id = profiles.id)
);

-- 3. Fix push_tokens: remove duplicate Turkish-named public-role policies
DROP POLICY IF EXISTS "Kullanıcılar kendi tokenlarını ekleyebilir" ON public.push_tokens;
DROP POLICY IF EXISTS "Kullanıcılar kendi tokenlarını görebilir" ON public.push_tokens;
DROP POLICY IF EXISTS "Kullanıcılar kendi tokenlarını güncelleyebilir" ON public.push_tokens;
