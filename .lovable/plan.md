

## Zero-Latency Cache for Diet Plan & Calendar (Epic 8)

### Problem

`useNutritionCalendar` already has a global logs cache but `assignedDaysMap` resets to empty on every mount, causing stale calendar renders until the fetch completes. `useDietPlan` has no global cache at all — `allFoods` resets to `[]` on unmount, triggering the loading spinner every tab switch.

### Changes

**1. `src/hooks/useNutritionCalendar.ts` — Add global cache for assigned days**

- Add a second module-level cache: `const globalAssignedCache = new Map<string, Map<string, number>>()`
- Initialize `assignedDaysMap` state from this cache (same pattern as existing `globalLogsCache`)
- In the SWR check (lines 71-76), also check `globalAssignedCache` — only show spinner if BOTH caches miss
- After fetch, write to `globalAssignedCache` alongside the existing `globalLogsCache` write

**2. `src/hooks/useDietPlan.ts` — Add module-level cache**

- Add two module-level caches outside the hook:
  - `const _foodsCache = new Map<string, PlannedFood[]>()`
  - `const _metaCache = new Map<string, { hasTemplate, startDate, durationWeeks, todayDay }>()`
- Initialize all `useState` calls from cache using lazy initializer `() => cache.get(key) ?? default`
- Cache key = `user.id`
- After successful fetch, write mapped foods + metadata to caches
- On no-template path, clear that user's cache entry
- `isLoading` init: `() => !_foodsCache.has(key)` — false if cache exists

### Result

- First load: brief spinner while fetching
- All subsequent mounts (tab switches, dialog open/close): instant render from module-level memory, silent background refresh

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useDietPlan.ts` | Add `_foodsCache` + `_metaCache`, init state from cache, write after fetch |
| `src/hooks/useNutritionCalendar.ts` | Add `globalAssignedCache`, init `assignedDaysMap` from it, update SWR check |

