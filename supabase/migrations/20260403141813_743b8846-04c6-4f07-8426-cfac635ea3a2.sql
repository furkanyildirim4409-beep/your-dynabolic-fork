CREATE POLICY "Athletes can update servings_left on own supplements"
ON public.assigned_supplements
FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());