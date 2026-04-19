

## Plan: Discover Feed — Following-Only + Coach Profile Media Fix

### Investigation completed (from existing files in context)

- `useSocialFeed.useSocialPosts` currently does an unfiltered `select * from social_posts` → must be scoped to followed coaches.
- `useFollowSystem` already uses `user_follows(follower_id, followed_id)` — reuse this table.
- `social_posts` schema has multiple media columns: `image_url`, `before_image_url`, `after_image_url`, `video_url`, `video_thumbnail_url`, `type`. The mapper in `useSocialFeed` already returns all of them, but `useCoachPosts` in `useCoachDetail.ts` does too — so data shape parity exists. Need to verify what `<SocialPostCard />` actually consumes vs what's mapped (likely a mismatch on a unified `media_url` field, or `image_url` not in select).

### Pre-flight checks (during execution)
1. Read `src/components/SocialPostCard.tsx` (or equivalent — locate via search) to determine the exact prop shape it expects (`media_url` vs separate columns, `author` vs `coach`, etc.).
2. Read `src/pages/Kesfet.tsx` and `src/pages/CoachProfile.tsx` to see how each renders posts — confirm whether they already share `<SocialPostCard />` or use ad-hoc JSX.
3. Verify `social_posts` columns include `image_url` (memory note `social-posts-schema-media` confirms multi-column media schema with image fallback).

---

### Step A — Following-Only Feed (`src/hooks/useSocialFeed.ts`)

Modify `useSocialPosts` `queryFn`:

1. Early return `[]` if no `userId`.
2. Fetch followed coach IDs:
   ```ts
   const { data: follows } = await supabase
     .from("user_follows")
     .select("followed_id")
     .eq("follower_id", userId);
   const followedIds = (follows ?? []).map(f => f.followed_id);
   if (followedIds.length === 0) return [];
   ```
3. Add `.in("coach_id", followedIds)` to the existing posts query.
4. Rest of the aggregation (likes, mapping) stays unchanged.
5. Bump `queryKey` to `["social-posts", "following", userId]` to avoid stale cache from the old global feed.

No styling/UI changes. Empty-state UI in `Kesfet.tsx` deferred to a later step per the user's instruction.

---

### Step B — Coach Profile Media Fix

Two probable root causes (will confirm during execution):

**B1. Missing `image_url` in select:**  
`useCoachPosts` uses `select("*, profiles!coach_id(...)")` — `*` should include `image_url`, but if the column exists yet the post card reads a different field name, mapping is broken. Will:
- Add explicit column list instead of `*` to guarantee `image_url`, `video_url`, `video_thumbnail_url`, `before_image_url`, `after_image_url`, `type`, `content`, `created_at` are returned.

**B2. Prop-shape mismatch with `<SocialPostCard />`:**  
After reading the card component, will:
- Either rename mapper output keys in `useCoachPosts` to match what the card expects, OR
- If `Kesfet.tsx` passes a wrapper-derived `media_url`/`media_type` derived from `type`, replicate the same derivation in `CoachProfile.tsx`'s render path so both pages feed identical props.
- Ensure `coach` object (name, avatar) is consistently named — already aligned in both hooks.

**B3. Unified component usage:**  
- If `CoachProfile.tsx` uses inline JSX instead of `<SocialPostCard />`, swap to the shared component using the same mapped data structure as `Kesfet.tsx`.

No visual restyling — only data wiring.

---

### Files to change

| File | Change |
|------|--------|
| `src/hooks/useSocialFeed.ts` | Filter feed by `user_follows`; bump query key |
| `src/hooks/useCoachDetail.ts` | Explicit column select in `useCoachPosts`; align mapper keys with `<SocialPostCard />` |
| `src/pages/CoachProfile.tsx` | Swap to shared `<SocialPostCard />` if not already; ensure props match |

No DB migration required (reuses existing `user_follows` and `social_posts` tables).

