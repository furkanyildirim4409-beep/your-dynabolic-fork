CREATE OR REPLACE FUNCTION public.get_coach_leaderboard_v2()
RETURNS TABLE (
  coach_id uuid,
  full_name text,
  avatar_url text,
  specialty text,
  level integer,
  student_count bigint,
  total_likes bigint,
  calculated_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH coaches AS (
    SELECT id, full_name, avatar_url, specialty, COALESCE(level, 1) AS level
    FROM profiles
    WHERE role = 'coach'
  ),
  students AS (
    SELECT coach_id, COUNT(*)::bigint AS student_count
    FROM profiles
    WHERE role = 'athlete' AND coach_id IS NOT NULL
    GROUP BY coach_id
  ),
  likes AS (
    SELECT sp.coach_id, COUNT(pl.id)::bigint AS total_likes
    FROM social_posts sp
    LEFT JOIN post_likes pl ON pl.post_id = sp.id
    WHERE sp.coach_id IS NOT NULL
    GROUP BY sp.coach_id
  )
  SELECT
    c.id AS coach_id,
    c.full_name,
    c.avatar_url,
    c.specialty,
    c.level,
    COALESCE(s.student_count, 0) AS student_count,
    COALESCE(l.total_likes, 0) AS total_likes,
    (COALESCE(s.student_count, 0) * 100
      + COALESCE(l.total_likes, 0) * 0.5
      + c.level * 50)::numeric AS calculated_score
  FROM coaches c
  LEFT JOIN students s ON s.coach_id = c.id
  LEFT JOIN likes l ON l.coach_id = c.id
  ORDER BY calculated_score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_leaderboard_v2() TO authenticated, anon;