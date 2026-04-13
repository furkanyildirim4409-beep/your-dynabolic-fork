

## Plan: Inject Live Data into Kesfet Feed Tab (Part 3)

### Summary
Replace the mock `allPosts` data in the AKIŞ tab with live Supabase data from `useSocialPosts` and `useToggleLike`, add skeleton loading states. No changes to KOÇLAR or MAĞAZA tabs.

### Changes to `src/pages/Kesfet.tsx`

**1. Imports** (line ~1-17)
- Add: `import { useSocialPosts, useToggleLike } from "@/hooks/useSocialFeed";`
- Add: `import { Skeleton } from "@/components/ui/skeleton";`

**2. Hook calls** (after line ~77)
- Add `const { data: livePosts, isLoading: feedLoading } = useSocialPosts();`
- Add `const { mutate: toggleLike } = useToggleLike();`
- Remove `const allPosts = getAllPosts();` (line 81)
- Remove `const [likedPosts, setLikedPosts] = useState(...)` (line 74)
- Remove `handleLike` function (line 100-102)

**3. AKIŞ TabsContent** (lines 221-301)
- Add loading skeleton: when `feedLoading`, render 3 skeleton cards mimicking post layout (avatar + name bar, image area, text lines, action bar)
- Replace `allPosts.map(...)` with `(livePosts ?? []).map(...)` 
- Map fields:
  - `post.coachAvatar` → `post.coach?.avatar_url`
  - `post.coachName` → `post.coach?.full_name`
  - `post.coachId` → `post.coach_id`
  - `post.beforeImage` → `post.before_image_url`
  - `post.afterImage` → `post.after_image_url`
  - `post.videoThumbnail` → `post.video_thumbnail_url`
  - `post.likes` → `post.likes_count`
  - `isLiked` → `post.user_has_liked`
- Like button: call `toggleLike({ postId: post.id, isCurrentlyLiked: post.user_has_liked })`
- Comments count: show `0` (no comments table yet)

**4. Cleanup**
- Remove `getAllPosts()` helper function (lines 56-65) — no longer needed
- Keep `getAllProducts()`, `coaches`, `getLeaderboardCoaches` imports for other tabs

### Files Changed
| File | Action |
|------|--------|
| `src/pages/Kesfet.tsx` | Edit imports, hooks, AKIŞ tab content, remove mock feed helpers |

No new files. No database changes.

