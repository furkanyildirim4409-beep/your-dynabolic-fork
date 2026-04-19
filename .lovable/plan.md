

## Plan: Story/Highlights Strict Separation + Dedup Hardening

### Step A — `useCoachSpecificStories` audit
Already correct. Current query (line ~138 in `useCoachDetail.ts`):
```ts
.eq("coach_id", coachId!)
.gte("expires_at", new Date().toISOString())
```
Two minor tightenings:
- Switch `.gte` → `.gt` (stories at the exact expiry instant should be excluded).
- No `is_highlighted` clause exists here — already clean. Confirm in plan, no other change.

### Step B — `useCoachHighlights` case-insensitive grouping

In `src/hooks/useCoachDetail.ts`, change grouping to use a normalized key while preserving the original display label:

```ts
const seenIds = new Set<string>();
const grouped = new Map<string, { display: string; stories: CoachStoryRow[] }>();

for (const s of (data ?? []) as any[]) {
  if (!s?.id || seenIds.has(s.id)) continue;
  seenIds.add(s.id);

  const rawCat = typeof s.category === "string" ? s.category.trim() : "";
  const display = rawCat.length > 0 ? rawCat : "Öne Çıkanlar";
  const key = display.toLocaleUpperCase("tr-TR");

  const row: CoachStoryRow = { /* ...mapped... */ };

  if (!grouped.has(key)) grouped.set(key, { display, stories: [] });
  grouped.get(key)!.stories.push(row);
}

return Array.from(grouped.values())
  .map(({ display, stories }) => ({
    category: display,
    cover_image: stories[0]?.media_url ?? "",
    stories,
  }))
  .filter((h) => !!h.cover_image && h.stories.length > 0);
```

`tr-TR` locale upper-case ensures "i" → "İ" handles Turkish category names correctly. `seenIds` already prevents the same story landing in two buckets.

### Step C — `CoachHighlightsRow.tsx` strict React keys

Current code uses `key={highlight.category}` already (good — not index-based). Two safety upgrades:
1. Defensive top-level dedup by category at render time:
   ```ts
   const uniqueHighlights = Array.from(
     new Map(highlights.map(h => [h.category, h])).values()
   );
   ```
   Then map over `uniqueHighlights`. Guards against any upstream regression or StrictMode double-push.
2. Keep `key={highlight.category}` (already in place).

### Files

| File | Change |
|------|--------|
| `src/hooks/useCoachDetail.ts` | `useCoachSpecificStories`: `.gte` → `.gt`. `useCoachHighlights`: normalized Turkish-locale uppercase key, preserved display label, drop empty groups. |
| `src/components/CoachHighlightsRow.tsx` | Defensive `Map`-based dedup pass before render; keep stable `key={highlight.category}`. |

No DB changes. No new hooks. No memory update needed (current `mem://features/coach-story-highlights` already covers the contract; this is internal hardening).

