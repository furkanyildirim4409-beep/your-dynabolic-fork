

## Plan: Discover Interaction Engine — Likes, Comments, Native Share

### Pre-flight investigation needed
1. Locate the actual feed post card — `SocialPostCard.tsx` is referenced but not in file list. Need to search to confirm whether posts in `Kesfet.tsx` are rendered inline or via a component.
2. Check if `post_comments` table exists in DB; if not, create migration.
3. Confirm current Like/Share/Comment button wiring in the rendering location.

---

### Step A — Real Likes (Optimistic UI)

`useToggleLike` already exists in `useSocialFeed.ts` with optimistic cache updates. Work needed:
- Locate the Like button in the feed render path (Kesfet.tsx or extracted component).
- Wire `onClick={() => toggleLike.mutate({ postId: post.id, isCurrentlyLiked: post.user_has_liked })}`.
- Bind heart icon classes: `fill-red-500 text-red-500` when `post.user_has_liked`, else neutral.
- Show `post.likes_count` next to icon.

No new hook needed.

---

### Step B — Real Comments (Drawer)

**DB Migration** (new):
```sql
CREATE TABLE public.post_comments (
  id uuid PK default gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL default now()
);
ALTER TABLE post_comments ENABLE RLS;
-- SELECT: anyone authenticated can read comments on posts they can see (any auth user, since posts table is read-broad)
-- INSERT: user_id = auth.uid()
-- DELETE: user_id = auth.uid()
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id, created_at DESC);
```

**New hook `src/hooks/usePostComments.ts`:**
- `usePostComments(postId)` → fetch comments + joined `profiles(full_name, avatar_url)`, ordered by `created_at asc`.
- `useAddComment()` mutation → insert + optimistic prepend; invalidate on settled.
- Also bumps a `comments_count` derived from query length (no DB column needed yet).

**New component `src/components/PostCommentsDrawer.tsx`:**
- shadcn `<Drawer>` opened from feed card.
- Header: "Yorumlar".
- Scrollable list: avatar + name + content + relative time (existing `formatDistanceToNow` patterns).
- Sticky bottom input (`Textarea` autosize or `Input`) + Send button. Disabled while empty/sending.
- Dark theme: `bg-zinc-950 border-zinc-800`, input `bg-zinc-900`, matches existing aesthetic per `mem://style/ui-aesthetic`.
- Empty state: "İlk yorumu sen yap".

---

### Step C — Native Share

In the feed card:
- Replace existing share handler with `navigator.share()` block (exact snippet from user's spec).
- Fallback: `navigator.clipboard.writeText` + `toast.success("Bağlantı kopyalandı!")` from `sonner`.
- Wrap in try/catch; ignore `AbortError` (user cancelled the share sheet) silently.

Note: `/post/:id` route does not exist yet — link will currently 404. Out-of-scope for this step but flagged.

---

### Step D — Render-path consolidation

Will determine during execution:
- If `Kesfet.tsx` renders post cards inline → wire Likes/Comments/Share directly there AND in `CoachProfile.tsx` post grid.
- If a shared `SocialPostCard` exists → centralize all three handlers there.

Goal: single source of truth for interaction logic across Discover and Coach Profile.

---

### Files to change

| File | Action |
|------|--------|
| `supabase/migrations/<ts>_post_comments.sql` | New table + RLS + index |
| `src/hooks/usePostComments.ts` | New (fetch + add mutation) |
| `src/components/PostCommentsDrawer.tsx` | New |
| `src/pages/Kesfet.tsx` | Wire like/comment/share in feed render |
| `src/pages/CoachProfile.tsx` | Same wiring for coach post grid |
| (optional) `src/components/SocialPostCard.tsx` | If found/extracted, centralize logic here |

No styling refactor — only data wiring + new drawer component matching existing dark aesthetic.

