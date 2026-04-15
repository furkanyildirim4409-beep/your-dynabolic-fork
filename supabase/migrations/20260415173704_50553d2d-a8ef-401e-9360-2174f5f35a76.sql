-- Drop the overly restrictive athlete leaderboard policy
DROP POLICY IF EXISTS "Authenticated can read athlete leaderboard data" ON public.profiles;

-- Allow all authenticated users to view athlete profiles (for leaderboard/competition)
CREATE POLICY "Authenticated can view athlete profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'athlete');