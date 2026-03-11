ALTER TABLE public.workout_logs 
ADD COLUMN assigned_workout_id uuid REFERENCES public.assigned_workouts(id) ON DELETE SET NULL;