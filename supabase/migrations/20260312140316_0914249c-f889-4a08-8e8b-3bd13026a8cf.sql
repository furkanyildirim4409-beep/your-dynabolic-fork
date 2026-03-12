
CREATE TABLE public.checkin_edit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.daily_checkins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  previous_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkin_edit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own edit logs"
  ON public.checkin_edit_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete edit logs"
  ON public.checkin_edit_logs
  FOR SELECT
  TO authenticated
  USING (is_coach_of(user_id));
