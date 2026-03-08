
DROP POLICY IF EXISTS "Users manage own measurements" ON public.body_measurements;
CREATE POLICY "Users manage own measurements"
  ON public.body_measurements FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view athlete measurements" ON public.body_measurements;
CREATE POLICY "Coaches can view athlete measurements"
  ON public.body_measurements FOR SELECT TO authenticated
  USING (is_coach_of(user_id));
