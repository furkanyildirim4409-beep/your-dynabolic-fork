
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'athlete',
  ADD COLUMN IF NOT EXISTS athlete_count text,
  ADD COLUMN IF NOT EXISTS specialty text;

CREATE POLICY "Authenticated users can insert into waitlist"
  ON public.waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
