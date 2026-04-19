DROP POLICY IF EXISTS "Herkes aktif hikayeleri görebilir" ON public.coach_stories;

CREATE POLICY "Public can view active or highlighted stories"
ON public.coach_stories
FOR SELECT
TO public
USING (
  now() < expires_at
  OR is_highlighted = true
  OR category IS NOT NULL
);