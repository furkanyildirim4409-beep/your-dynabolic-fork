CREATE POLICY "Athletes can view completed challenges for leaderboard"
ON public.challenges FOR SELECT TO authenticated
USING (status = 'completed');