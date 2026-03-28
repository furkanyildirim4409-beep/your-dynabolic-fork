
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Açık',
  coach_reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can view athlete tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can update athlete tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Team members can view tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (is_active_team_member_of(coach_id));

CREATE POLICY "Team members can update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (is_active_team_member_of(coach_id));
