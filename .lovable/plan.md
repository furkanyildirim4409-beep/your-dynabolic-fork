

## Plan: Story Views Engine & Discovery Fix (Epic 5 - Part 1)

### Summary
Create a `story_views` table for persistent view tracking, build hooks to read/write views, fix Discovery to play ALL stories per coach (not just one), and apply brand colors everywhere.

---

### Step 1 -- Database Migration: `story_views` table

```sql
CREATE TABLE public.story_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id uuid NOT NULL,
    viewer_id uuid NOT NULL,
    viewed_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views"
ON public.story_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can read own views"
ON public.story_views FOR SELECT TO authenticated
USING (auth.uid() = viewer_id);

CREATE POLICY "Coaches can read views on their stories"
ON public.story_views FOR SELECT TO authenticated
USING (story_id IN (SELECT id FROM public.coach_stories WHERE coach_id = auth.uid()));
```

No foreign key to `auth.users` (per guidelines). We reference `coach_stories(id)` with `ON DELETE CASCADE` for cleanup.

---

### Step 2 -- Create `src/hooks/useStoryViews.ts`

Two hooks:

- **`useMyViewedStoryIds()`** -- Fetches all `story_id` values from `story_views` where `viewer_id = user.id`. Returns `string[]`.

- **`useMarkStoryViewed()`** -- Mutation that upserts `{ story_id, viewer_id }` into `story_views` (using `.upsert` with `onConflict: 'story_id,viewer_id'` to ignore duplicates). On success, invalidates `["my-viewed-story-ids"]`.

---

### Step 3 -- Update `CoachProfile.tsx`

- Remove `allStoriesWatched` local state.
- Import `useMyViewedStoryIds` and `useMarkStoryViewed`.
- Derive `allWatched`: `stories?.every(s => viewedIds?.includes(s.id))`.
- Avatar ring colors change from pink/red/yellow to brand primary:
  - Unwatched: `bg-gradient-to-tr from-primary to-primary/60`
  - Watched: `border-2 border-muted-foreground/30`
- In `handleAvatarClick`, after opening stories, call `markViewed` for each story id.

---

### Step 4 -- Fix Discovery `handleStoryClick` in `Kesfet.tsx`

Currently passes only 1 story. Fix:

- Filter `liveStories` by the clicked coach's `coach_id` to get ALL their active stories.
- Map all of them into `Story[]` and pass the full array to `openStories`.
- Ring colors already use `from-primary`; add watched/unwatched logic using `useMyViewedStoryIds`:
  - If all stories for that coach are viewed: subtle `border-muted-foreground/30` ring.
  - Otherwise: gradient `from-primary to-primary/60` ring.

---

### Files Changed
| File | Action |
|------|--------|
| Migration SQL | Create `story_views` table + RLS |
| `src/hooks/useStoryViews.ts` | New file: `useMyViewedStoryIds`, `useMarkStoryViewed` |
| `src/pages/CoachProfile.tsx` | Persistent watched state, brand ring colors |
| `src/pages/Kesfet.tsx` | Play ALL coach stories, watched ring states |

