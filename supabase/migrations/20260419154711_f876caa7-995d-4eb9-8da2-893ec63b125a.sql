CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.post_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id, created_at DESC);