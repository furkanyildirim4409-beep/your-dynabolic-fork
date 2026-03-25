CREATE TABLE IF NOT EXISTS public.challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.challenge_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_messages.challenge_id
      AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages" ON public.challenge_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_messages.challenge_id
      AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
    )
  );