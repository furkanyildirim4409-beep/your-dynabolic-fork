CREATE TABLE public.user_follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid NOT NULL,
    followed_id uuid NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows" ON public.user_follows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);