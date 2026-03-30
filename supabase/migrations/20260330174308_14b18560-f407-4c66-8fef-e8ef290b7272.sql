
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  goal text,
  instagram text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anonymous users can submit the form
CREATE POLICY "Anyone can insert into waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (coaches/admins) can read waitlist entries
CREATE POLICY "Authenticated users can view waitlist"
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (true);
