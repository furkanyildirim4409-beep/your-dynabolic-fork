

## Plan: Hotfix — Remove B2B Block + Fix Invisible Highlight Covers

### Step A — `src/pages/CoachProfile.tsx`
Remove the entire "DYNABOLIC ALTYAPISI" block (the `mt-8 px-4` wrapper containing the 4-item grid with `ScanLine`, `Eye`, `LayoutDashboard`, `Mail`). Also remove the now-unused lucide imports for those four icons. Restore flow: Bio/Stats → `<CoachHighlightsRow />` → Tabs.

### Step B — `src/hooks/useCoachDetail.ts` (`useCoachHighlights`)

Make cover matching ultra-defensive:

1. **Normalized key helper** — apply identically on both sides:
   ```ts
   const normKey = (s: string) => s.trim().toLocaleUpperCase("tr-TR").replace(/\s+/g, "");
   ```

2. **Build `metaMap` safely** from `metaRes.data` (treat null as empty):
   ```ts
   const metaMap = new Map<string, string>();
   for (const m of (metaRes?.data ?? []) as any[]) {
     const name = typeof m?.category_name === "string" ? m.category_name : "";
     const url = typeof m?.custom_cover_url === "string" ? m.custom_cover_url : "";
     if (!name.trim() || !url.trim()) continue;
     metaMap.set(normKey(name), url);
   }
   ```

3. **Resolve cover with safe fallback** — never let `undefined` slip through, never drop a group just because the custom cover is missing:
   ```ts
   return Array.from(grouped.values())
     .map(({ display, stories }) => {
       const key = normKey(display);
       let cover = metaMap.get(key);
       if (!cover || !cover.trim()) {
         cover = stories[0]?.media_url ?? "";
       }
       return { category: display, cover_image: cover, stories };
     })
     .filter((h) => h.cover_image.trim().length > 0 && h.stories.length > 0);
   ```

This guarantees: (a) if custom cover exists → use it, (b) otherwise → fall back to first story media, (c) only drop a bucket when truly no media exists at all.

### Files

| File | Action |
|------|--------|
| `src/pages/CoachProfile.tsx` | Delete B2B "DYNABOLIC ALTYAPISI" block + unused icon imports |
| `src/hooks/useCoachDetail.ts` | Rewrite `useCoachHighlights` cover resolution with normalized key + safe fallback |

No DB changes. No other components touched.

