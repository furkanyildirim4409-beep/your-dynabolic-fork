
-- Fix weight_logs: drop RESTRICTIVE policies, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users manage own weight logs" ON public.weight_logs;
CREATE POLICY "Users manage own weight logs"
  ON public.weight_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view athlete weight logs" ON public.weight_logs;
CREATE POLICY "Coaches can view athlete weight logs"
  ON public.weight_logs FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- Fix profiles: drop RESTRICTIVE policies, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;
CREATE POLICY "Coaches can update athlete profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can view athlete profiles" ON public.profiles;
CREATE POLICY "Coaches can view athlete profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (coach_id = auth.uid());
