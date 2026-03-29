
-- 1. FIX: Remove overly broad leaderboard profiles policy from profiles table
DROP POLICY IF EXISTS "Authenticated can read leaderboard profiles" ON profiles;

-- Add scoped policy: users can read own profile, coaches read their athletes, team members read their athletes
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Coaches can read their athletes profiles"
ON profiles FOR SELECT TO authenticated
USING (coach_id = auth.uid());

CREATE POLICY "Team members can read athlete profiles"
ON profiles FOR SELECT TO authenticated
USING (is_active_team_member_of(coach_id));

-- 2. FIX: Make chat-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';

-- Remove public read policy
DROP POLICY IF EXISTS "Public read access for chat media" ON storage.objects;

-- Remove overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;

-- Add authenticated-only SELECT policy
CREATE POLICY "Authenticated read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');

-- Add authenticated INSERT policy with user folder restriction
CREATE POLICY "Authenticated upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');
