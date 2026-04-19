

## Plan: Dynamic Leaderboard RPC + Custom Highlight Covers + B2B Block

### 1. Leaderboard RPC (`get_coach_leaderboard_v2`)

New SQL migration creating a SECURITY DEFINER function:

```sql
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
    SELECT id, full_name, avatar_url, specialty, COALESCE(level,1) AS level
    FROM profiles WHERE role = 'coach'
  ),
  students AS (
    SELECT coach_id, COUNT(*)::bigint AS student_count
    FROM profiles WHERE role = 'athlete' AND coach_id IS NOT NULL
    GROUP BY coach_id
  ),
  likes AS (
    SELECT sp.coach_id, COUNT(pl.id)::bigint AS total_likes
    FROM social_posts sp
    LEFT JOIN post_likes pl ON pl.post_id = sp.id
    GROUP BY sp.coach_id
  )
  SELECT
    c.id, c.full_name, c.avatar_url, c.specialty, c.level,
    COALESCE(s.student_count, 0),
    COALESCE(l.total_likes, 0),
    (COALESCE(s.student_count,0) * 100
     + COALESCE(l.total_likes,0) * 0.5
     + c.level * 50)::numeric AS calculated_score
  FROM coaches c
  LEFT JOIN students s ON s.coach_id = c.id
  LEFT JOIN likes l ON l.coach_id = c.id
  ORDER BY calculated_score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_leaderboard_v2() TO authenticated, anon;
```

**Hook update** — `useLeaderboardCoaches` in `src/hooks/useDiscoveryData.ts`:
- Replace current profiles+manual-count logic with `supabase.rpc('get_coach_leaderboard_v2')`.
- Map RPC rows → `LeaderboardCoach`: `score = calculated_score`, `students = student_count`, `rating = 4.9` (kept), `hasNewStory = false` (kept; ring logic untouched).
- No change required in `Kesfet.tsx` — it already consumes `useLeaderboardCoaches`.

### 2. Custom highlight covers via `coach_highlight_metadata`

Schema confirmed: `coach_highlight_metadata(coach_id, category_name, custom_cover_url)` already exists.

Update `useCoachHighlights` in `src/hooks/useCoachDetail.ts`:
- After fetching `coach_stories`, run a parallel fetch:
  ```ts
  const { data: meta } = await supabase
    .from('coach_highlight_metadata')
    .select('category_name, custom_cover_url')
    .eq('coach_id', coachId);
  ```
- Build a normalized lookup: `Map<UPPER(category_name.trim()), custom_cover_url>`.
- During grouping, when emitting each highlight bucket: `cover_image = metaMap.get(key) ?? stories[0].media_url`.
- Preserves all existing dedup + Turkish-locale upper-case key logic.

No change needed in `CoachHighlightsRow.tsx`.

### 3. B2B "Powered by Dynabolic" block on Coach Profile

In `src/pages/CoachProfile.tsx`, add a new compact info card placed under the bio / above posts (or inside the existing "Seni Neler Bekliyor" area if present — will check during implementation and reuse if found, else insert standalone). Content:

> **Bu Koç Dynabolic Altyapısını Kullanıyor**
> - 🧬 AI NutriScanner — gıda etiketi tarama
> - 👁 Vision AI — form ve poz analizi
> - 📊 Kişisel Performans Paneli
> - ✉️ Koça Özel Profesyonel E-posta Sistemi

Glassmorphic card, neon-lime accent, lucide icons (`ScanLine`, `Eye`, `LayoutDashboard`, `Mail`), small grid (2 cols on mobile). Read-only, static — no data fetch.

### Files

| File | Action |
|------|--------|
| New migration | Create `get_coach_leaderboard_v2()` RPC + grant |
| `src/hooks/useDiscoveryData.ts` | Rewrite `useLeaderboardCoaches` to call RPC |
| `src/hooks/useCoachDetail.ts` | `useCoachHighlights`: parallel fetch metadata, custom cover override |
| `src/pages/CoachProfile.tsx` | Insert B2B "Powered by Dynabolic" info card |
| `mem://features/coach-story-highlights` | Note custom cover override contract |
| `mem://features/leaderboard-system` | Add coach leaderboard RPC formula |

No DB schema changes (table already exists). No breaking changes to ring/highlights separation.

