

## Plan: Discover Page Data Layer — Auto-Assignment & Social Graph

### Goals
1. Auto-assign athletes to coaches when a coaching package order is paid.
2. Replace mock student/follower counts with real DB-driven values across Discover & Coach Profile.
3. Expose a "Takipçiler" (followers) data source for a future modal.

---

### Step A — Auto-Assignment (DB)

**Investigation needed first** (will do during execution):
- Confirm `orders` table schema (status, items JSONB shape, buyer user_id column).
- Confirm `team_assignments` schema (coach_id, athlete_id, status columns).
- Verify how `coach_id` is encoded inside `coach_products` / order items.

**Migration:**
- Create `SECURITY DEFINER` function `public.handle_coaching_order_paid()`.
- Logic: when `NEW.status = 'paid'` and `OLD.status <> 'paid'`, iterate over `NEW.items` JSONB; for each item where `item_type = 'coaching'`, extract `coach_id` and INSERT into `team_assignments(coach_id, athlete_id, status)` with `ON CONFLICT (coach_id, athlete_id) DO UPDATE SET status='active'`.
- Trigger: `AFTER INSERT OR UPDATE OF status ON public.orders`.
- Backfill: one-shot INSERT for existing paid coaching orders.

**Note:** if `team_assignments` lacks a unique `(coach_id, athlete_id)` constraint, the migration will add one. If `orders` table doesn't exist yet, plan stops and surfaces the gap.

---

### Step B — Social Graph (Followers table)

`user_follows` already exists (`follower_id`, `followed_id`) per `useFollowSystem.ts`. **No new table needed.** We will reuse it. The user's request mentioned `followers` — clarifying via reuse to avoid duplication.

---

### Step C — Dynamic Counts (Hooks)

**Extend `src/hooks/useCoachProfile.ts`** (currently fetches own coach via `profile.coach_id`) — keep as-is, but also add:

**New hook `src/hooks/useCoachStats.ts`:**
```ts
export function useCoachStats(coachId?: string) {
  // Returns { studentCount, followerCount }
  // studentCount: count(team_assignments) where coach_id=coachId and status='active'
  // followerCount: count(user_follows) where followed_id=coachId
  // Two parallel head:true count queries, staleTime 60s
}
```

**New hook `src/hooks/useCoachFollowers.ts`:**
```ts
export function useCoachFollowers(coachId?: string) {
  // SELECT follower_id, profiles!follower_id(full_name, avatar_url)
  // FROM user_follows WHERE followed_id = coachId
  // Returns array for future "Takipçiler" modal list
}
```

---

### Step D — UI Bindings (data only, no styling)

| File | Change |
|------|--------|
| `src/pages/CoachProfile.tsx` | Replace any hardcoded student/follower numbers with `useCoachStats(coachId)` data. Keep existing `useFollowerCount` as fallback or swap to unified hook. |
| `src/pages/Kesfet.tsx` (Discover) | If `LeaderboardCoach.students` is mock, fetch real counts via batched query in `useDiscoveryData.ts` `useLeaderboardCoaches`. |
| `src/hooks/useDiscoveryData.ts` | In `useLeaderboardCoaches`, after fetching coaches, batch-count team_assignments per coach (single grouped query) and inject real `students` value. |

---

### Step E — Files Changed Summary

| File | Action |
|------|--------|
| `supabase/migrations/<ts>_coaching_auto_assign.sql` | New trigger + function + backfill + unique constraint |
| `src/hooks/useCoachStats.ts` | New |
| `src/hooks/useCoachFollowers.ts` | New |
| `src/hooks/useDiscoveryData.ts` | Inject real student counts into leaderboard |
| `src/pages/CoachProfile.tsx` | Bind to `useCoachStats` |
| `src/pages/Kesfet.tsx` | (If mock counts surfaced) bind to real data |

---

### Open Items (resolved at execution)
- Exact `orders` schema → will inspect via `supabase--read_query` before writing trigger.
- Exact `team_assignments` schema → same.
- If neither table exists, will halt and report instead of inventing schema.

No styling changes. Pure data layer & bindings.

