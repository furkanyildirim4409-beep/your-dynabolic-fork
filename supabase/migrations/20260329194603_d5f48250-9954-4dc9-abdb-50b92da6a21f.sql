
-- 1. Fix progress-photos bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'progress-photos';

-- Remove public read policy on progress-photos
DROP POLICY IF EXISTS "Public read progress photos" ON storage.objects;

-- Add authenticated owner-only SELECT policy
CREATE POLICY "Athletes read own progress photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add coach read policy
CREATE POLICY "Coaches read athlete progress photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND is_coach_of((storage.foldername(name))[1]::uuid)
);

-- 2. Fix exercise_library: drop overly permissive ALL policy, add read-only for all + write for coaches
DROP POLICY IF EXISTS "Authenticated users full access" ON exercise_library;

CREATE POLICY "All authenticated can read exercise library"
ON exercise_library FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Coaches manage exercise library"
ON exercise_library FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'coach'))
WITH CHECK (public.has_role(auth.uid(), 'coach'));

-- 3. Fix badge self-award: remove athlete INSERT policy, create server-side function
DROP POLICY IF EXISTS "Athletes can insert own badges" ON athlete_badges;

CREATE OR REPLACE FUNCTION public.award_badge_if_earned(_badge_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge RECORD;
  v_profile RECORD;
  v_current_value numeric;
  v_workout_count bigint;
  v_checkin_count bigint;
BEGIN
  -- Check if already earned
  IF EXISTS (SELECT 1 FROM athlete_badges WHERE athlete_id = auth.uid() AND badge_id = _badge_id) THEN
    RETURN FALSE;
  END IF;

  -- Get badge conditions
  SELECT * INTO v_badge FROM badges WHERE id = _badge_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_badge.condition_type IS NULL OR v_badge.condition_value IS NULL THEN RETURN FALSE; END IF;

  -- Get profile stats
  SELECT streak, total_volume_kg INTO v_profile FROM profiles WHERE id = auth.uid();

  -- Get counts
  SELECT count(*) INTO v_workout_count FROM assigned_workouts WHERE athlete_id = auth.uid() AND status = 'completed';
  SELECT count(*) INTO v_checkin_count FROM daily_checkins WHERE user_id = auth.uid();

  -- Evaluate condition
  CASE v_badge.condition_type
    WHEN 'streak_days' THEN v_current_value := COALESCE(v_profile.streak, 0);
    WHEN 'workout_count' THEN v_current_value := v_workout_count;
    WHEN 'total_volume' THEN v_current_value := COALESCE(v_profile.total_volume_kg, 0);
    WHEN 'checkin_count' THEN v_current_value := v_checkin_count;
    ELSE RETURN FALSE;
  END CASE;

  IF v_current_value < v_badge.condition_value THEN
    RETURN FALSE;
  END IF;

  -- Award badge
  INSERT INTO athlete_badges (athlete_id, badge_id) VALUES (auth.uid(), _badge_id);

  -- Award XP
  IF COALESCE(v_badge.xp_reward, 0) > 0 THEN
    UPDATE profiles SET xp = COALESCE(xp, 0) + v_badge.xp_reward WHERE id = auth.uid();
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. Fix leaderboard_profiles view: add RLS via security_invoker
-- The view already has security_invoker = true, but we need to ensure
-- the underlying profiles table RLS allows athletes to read other athletes' limited data.
-- The view filters to role = 'athlete' already. Since it's security_invoker,
-- we need an RLS policy on profiles that allows authenticated users to read
-- the limited leaderboard columns. The existing "Users can view own profile" handles self,
-- but we need cross-user read for leaderboard. Let's re-add a scoped policy.
CREATE POLICY "Authenticated can read leaderboard profiles"
ON profiles FOR SELECT TO authenticated
USING (role = 'athlete');

-- 5. Fix RLS always-true on exercise_library (already handled above by dropping the ALL policy)
