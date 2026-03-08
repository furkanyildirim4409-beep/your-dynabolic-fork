
-- Athletes can view programs assigned to them
CREATE POLICY "Athletes can view assigned programs"
ON public.programs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_workouts
    WHERE assigned_workouts.program_id = programs.id
      AND assigned_workouts.athlete_id = auth.uid()
  )
);

-- Athletes can view exercises of assigned programs
CREATE POLICY "Athletes can view assigned exercises"
ON public.exercises FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_workouts aw
    JOIN public.programs p ON p.id = aw.program_id
    WHERE p.id = exercises.program_id
      AND aw.athlete_id = auth.uid()
  )
);
