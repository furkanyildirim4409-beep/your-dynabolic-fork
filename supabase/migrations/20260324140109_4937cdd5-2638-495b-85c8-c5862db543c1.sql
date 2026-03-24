CREATE POLICY "Athletes can view other athletes for leaderboard"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'athlete');