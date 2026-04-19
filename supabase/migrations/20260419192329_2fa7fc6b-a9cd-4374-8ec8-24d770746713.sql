CREATE POLICY "Public can view highlight metadata"
ON public.coach_highlight_metadata
FOR SELECT
TO public
USING (true);