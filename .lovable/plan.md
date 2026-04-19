

## Plan: Highlights Read-Side Resilience

Schema confirmed: `coach_stories.is_highlighted boolean default false` exists. Plan from Coach Panel team aligns.

### Step 1 — Rewrite `useCoachHighlights` in `src/hooks/useCoachDetail.ts`

- Query: `.or("is_highlighted.eq.true,category.not.is.null")` (drop the `expires_at` filter — highlights are persistent regardless of 24h window)
- Order: `created_at desc` (unchanged)
- Mapping logic:
  ```ts
  const seenIds = new Set<string>();
  const grouped = new Map<string, CoachStoryRow[]>();
  for (const s of data ?? []) {
    if (seenIds.has(s.id)) continue;
    seenIds.add(s.id);
    const rawCat = typeof s.category === "string" ? s.category.trim() : "";
    const cat = rawCat.length > 0 ? rawCat : "Öne Çıkanlar";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(mappedRow);
  }
  return Array.from(grouped.entries()).map(([category, stories]) => ({
    category,
    cover_image: stories[0].media_url,
    stories,
  }));
  ```
- Global `seenIds` ensures no story appears in two buckets and no duplicate row appears within one bucket.

### Step 2 — `CoachHighlightsRow.tsx` polish

Current code already:
- Returns `null` while loading and when empty (no flicker)
- Uses `cover_image` (= first story's `media_url`)

Add one safety: filter out any group whose `stories[0]?.media_url` is falsy before rendering, so a malformed row never renders an empty circle. Single-line guard inside the hook's final `.map` is cleaner — drop groups with no usable cover.

### Step 3 — Memory update

Update `mem://features/coach-story-highlights` to record the new `is_highlighted` column + dual-filter contract + dedup rule.

### Files

| File | Action |
|------|--------|
| `src/hooks/useCoachDetail.ts` | Rewrite `useCoachHighlights` queryFn (filter, dedup Set, null-category fallback, drop empty-cover groups) |
| `mem://features/coach-story-highlights` | Update with `is_highlighted` flag + dedup contract |

No DB migration. No changes needed to `CoachHighlightsRow.tsx` (resilience handled upstream in the hook).

