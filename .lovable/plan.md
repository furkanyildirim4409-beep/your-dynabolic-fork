

## Plan: Build React Query Hooks for Kesfet Social Feed

### Summary
Create the data-fetching and mutation layer for the social feed using `@tanstack/react-query` and the existing `social_posts` / `post_likes` Supabase tables. No UI changes.

### Database Schema (already exists)

```text
social_posts: id, coach_id, content, type, before_image_url, after_image_url, video_thumbnail_url, video_url, created_at
post_likes:   id, post_id, user_id, created_at
```

RLS: SELECT is public on both tables. INSERT/DELETE on post_likes requires `auth.uid() = user_id`.

### Implementation Steps

**Step 1 -- Add SocialPost type to `src/types/shared-models.ts`**

Append a `SocialPost` interface:
- All columns from `social_posts`
- `coach: { full_name: string; avatar_url: string | null }` (from joined profiles)
- `likes_count: number`
- `user_has_liked: boolean`

**Step 2 -- Create `src/hooks/useSocialFeed.ts`**

Contains two exports:

1. **`useSocialPosts()`** -- `useQuery` hook
   - Query key: `["social-posts", user?.id]`
   - Fetches from `social_posts` with `select('*, profiles!coach_id(full_name, avatar_url)')` ordered by `created_at` desc
   - Separately fetches `post_likes` counts and current-user likes in a single pass (fetch all `post_likes` for the returned post IDs, then aggregate client-side -- avoids Supabase aggregate join limitations)
   - Maps results into `SocialPost[]`

2. **`useToggleLike()`** -- `useMutation` hook
   - Accepts `{ postId: string; isCurrentlyLiked: boolean }`
   - If liked: `DELETE FROM post_likes WHERE post_id = X AND user_id = auth.uid()`
   - If not liked: `INSERT INTO post_likes (post_id, user_id)`
   - **Optimistic update**: `onMutate` snapshots current query data, applies instant `likes_count +/- 1` and `user_has_liked` toggle via `queryClient.setQueryData`
   - **Rollback**: `onError` restores snapshot
   - **Revalidate**: `onSettled` calls `queryClient.invalidateQueries`

### Technical Notes
- The `post_likes` SELECT policy is `public` (uses `true`), so we can fetch all likes for aggregation without auth issues
- The `social_posts` SELECT policy is also `public`, so the feed works for all authenticated users
- Since the Supabase types file doesn't include `social_posts`/`post_likes` yet, we'll cast through `.from('social_posts' as any)` or define the row types manually; the types file will auto-regenerate on next schema sync
- Pattern follows existing hooks like `useChallenges.ts` which uses `useQuery` + `useMutation` + `useQueryClient`

### Files Changed
| File | Action |
|------|--------|
| `src/types/shared-models.ts` | Append `SocialPost` interface |
| `src/hooks/useSocialFeed.ts` | New file with `useSocialPosts` and `useToggleLike` |

No UI files are touched.

