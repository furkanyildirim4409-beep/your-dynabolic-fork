
-- Fix 1: Create a restricted view for leaderboard data (only expose needed columns)
CREATE OR REPLACE VIEW public.leaderboard_profiles AS
SELECT id, full_name, avatar_url, xp, streak, total_volume_kg, bio_coins, level, role
FROM public.profiles
WHERE role = 'athlete';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.leaderboard_profiles TO authenticated;

-- Drop the overly permissive leaderboard policy on profiles
DROP POLICY IF EXISTS "Athletes can view other athletes for leaderboard" ON public.profiles;

-- Fix 2: Re-scope public-role policies to authenticated

-- daily_checkins
DROP POLICY IF EXISTS "Coaches can view athlete checkins" ON public.daily_checkins;
CREATE POLICY "Coaches can view athlete checkins" ON public.daily_checkins
  FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- nutrition_logs
DROP POLICY IF EXISTS "Coaches can view athlete nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Coaches can view athlete nutrition logs" ON public.nutrition_logs
  FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- water_logs
DROP POLICY IF EXISTS "Coaches can view athlete water logs" ON public.water_logs;
CREATE POLICY "Coaches can view athlete water logs" ON public.water_logs
  FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- workout_logs
DROP POLICY IF EXISTS "Coaches can view athlete workout logs" ON public.workout_logs;
CREATE POLICY "Coaches can view athlete workout logs" ON public.workout_logs
  FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- messages (3 policies)
DROP POLICY IF EXISTS "Kullanıcılar kendi mesajlarını görebilir" ON public.messages;
CREATE POLICY "Kullanıcılar kendi mesajlarını görebilir" ON public.messages
  FOR SELECT TO authenticated
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

DROP POLICY IF EXISTS "Kullanıcılar mesaj gönderebilir" ON public.messages;
CREATE POLICY "Kullanıcılar mesaj gönderebilir" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Alıcılar okundu işaretleyebilir" ON public.messages;
CREATE POLICY "Alıcılar okundu işaretleyebilir" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- coach_invites (3 policies)
DROP POLICY IF EXISTS "Coaches can view own invites" ON public.coach_invites;
CREATE POLICY "Coaches can view own invites" ON public.coach_invites
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can create invites" ON public.coach_invites;
CREATE POLICY "Coaches can create invites" ON public.coach_invites
  FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete own invites" ON public.coach_invites;
CREATE POLICY "Coaches can delete own invites" ON public.coach_invites
  FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

-- push_tokens
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.push_tokens;
CREATE POLICY "Users can insert own tokens" ON public.push_tokens
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tokens" ON public.push_tokens;
CREATE POLICY "Users can view own tokens" ON public.push_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON public.push_tokens;
CREATE POLICY "Users can delete own tokens" ON public.push_tokens
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
