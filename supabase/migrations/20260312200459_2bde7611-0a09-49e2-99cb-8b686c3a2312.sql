CREATE POLICY "Coaches can update athlete blood test notes"
ON public.blood_tests
FOR UPDATE
TO authenticated
USING (is_coach_of(user_id))
WITH CHECK (is_coach_of(user_id));