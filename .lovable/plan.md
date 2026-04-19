

## Investigation

`useCoachHighlights` already exists in `useCoachDetail.ts` — fetches `coach_stories` filtered by `coach_id` and `category IS NOT NULL`, grouped by `category`, returning `{ category, cover_image, stories }[]`.

Note: schema uses `coach_stories` (not `social_stories`) and `category` (not `highlight_category`). It also filters out non-categorized rows — which functionally serves as the "highlight" flag here. This is fine; no DB change.

`StoryViewer` is opened via `useStory().openStories(stories, index, opts)` where each story = `{ id, title, thumbnail, content: { image, text? } }`. Pattern matches `StoriesRing.tsx`.

## Plan

### Step A — Data
Reuse `useCoachHighlights(coachId)` as-is. Already grouped by category, ordered by `created_at desc`, cover = first story's `media_url`. No changes needed.

### Step B — New `CoachHighlightsRow` component
`src/components/CoachHighlightsRow.tsx`:
- Props: `coachId: string`
- Calls `useCoachHighlights(coachId)`
- If empty/loading-empty → `return null`
- Renders horizontal scroll: `flex gap-4 overflow-x-auto py-4 px-4 [&::-webkit-scrollbar]:hidden`
- Each item:
  - 64px circle (`w-16 h-16 rounded-full`) with `ring-2 ring-primary/60 ring-offset-2 ring-offset-background p-[2px]`
  - Inner `<img src={cover_image}>` `object-cover rounded-full`
  - Below: truncated category label, `text-[11px] text-muted-foreground max-w-[72px] truncate`
- onClick → convert category's stories to `Story[]` shape and call `openStories(...)`:
  ```ts
  openStories(
    highlight.stories.map(s => ({
      id: s.id,
      title: highlight.category,
      thumbnail: s.media_url,
      content: { image: s.media_url },
    })),
    0,
    { categoryLabel: highlight.category, categoryGradient: "from-primary to-primary/60" }
  );
  ```

### Step C — Inject into `CoachProfile.tsx`
Place `<CoachHighlightsRow coachId={coachId} />` directly below the stats/follow row and above the `<Tabs>` block. Will locate the exact line during implementation.

### Files
| File | Action |
|------|--------|
| `src/components/CoachHighlightsRow.tsx` | New |
| `src/pages/CoachProfile.tsx` | Inject component above tabs |

No DB migration. No hook changes. No styling system changes.

