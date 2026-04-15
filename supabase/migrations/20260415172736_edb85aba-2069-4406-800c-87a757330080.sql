-- 1. Drop the dangerous public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 2. Drop legacy public-role INSERT/UPDATE policies (authenticated versions already exist)
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- 3. Replace the authenticated UPDATE policy with one that blocks sensitive column changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  AND xp IS NOT DISTINCT FROM (SELECT p.xp FROM public.profiles p WHERE p.id = auth.uid())
  AND bio_coins IS NOT DISTINCT FROM (SELECT p.bio_coins FROM public.profiles p WHERE p.id = auth.uid())
  AND level IS NOT DISTINCT FROM (SELECT p.level FROM public.profiles p WHERE p.id = auth.uid())
  AND subscription_tier IS NOT DISTINCT FROM (SELECT p.subscription_tier FROM public.profiles p WHERE p.id = auth.uid())
  AND subscription_status IS NOT DISTINCT FROM (SELECT p.subscription_status FROM public.profiles p WHERE p.id = auth.uid())
);