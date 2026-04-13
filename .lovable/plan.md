

## Plan: Build Follow System Infrastructure (Epic 2 - Part 1)

### Summary
Create the `user_follows` table in Supabase and build React Query hooks for follow/unfollow. No UI changes.

### Step 1 -- Database Migration

Create `user_follows` table with RLS policies:

```sql
CREATE TABLE public.user_follows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid NOT NULL,
    followed_id uuid NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Public read (for follower counts)
CREATE POLICY "Anyone can read follows" ON public.user_follows
  FOR SELECT TO authenticated USING (true);

-- Users can follow
CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
```

Note: No FK to `auth.users` (per project guidelines). `follower_id` and `followed_id` are plain UUIDs.

### Step 2 -- Create `src/hooks/useFollowSystem.ts`

Two hooks:

**`useFollowStatus(coachId)`** -- `useQuery<boolean>` checking if a row exists in `user_follows` where `follower_id = user.id` and `followed_id = coachId`. Returns `isFollowing` boolean plus `isLoading`.

**`useToggleFollow()`** -- `useMutation` accepting `{ coachId, isCurrentlyFollowing }`. If following, deletes the row; otherwise inserts. Optimistically updates the query cache. On settled, invalidates `["follow-status", coachId]`.

### Files Changed
| File | Action |
|------|--------|
| Migration SQL | New `user_follows` table + RLS |
| `src/hooks/useFollowSystem.ts` | New file with 2 hooks |

No UI files touched.

