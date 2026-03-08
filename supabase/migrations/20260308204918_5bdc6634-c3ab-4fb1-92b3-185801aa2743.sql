CREATE POLICY "Athletes can update own assignment status"
ON public.assigned_workouts
FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());