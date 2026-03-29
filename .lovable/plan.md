

## Zero-Latency Nutrition Fetch (Epic 8 - Part 1 Performance Hotfix)

### Problem

`useDietPlan.ts` makes 3 sequential queries (waterfall): `nutrition_targets` → `assigned_diet_days` → `diet_template_foods`. Steps 1 and 2 have no dependency on each other and can run in parallel. Step 3 depends on the template ID from step 1.

### Changes

**`src/hooks/useDietPlan.ts`**

1. **Parallelize steps 1 & 2** — Fire `nutrition_targets` and `assigned_diet_days` queries simultaneously via `Promise.all`
2. **Skip loading spinner on re-renders** — Only set `isLoading(true)` when `allFoods` is empty (first mount), so tab switches don't flash a spinner
3. Keep step 3 (`diet_template_foods`) sequential since it depends on `templateId` from step 1

```text
BEFORE (waterfall):
  nutrition_targets ──────► assigned_diet_days ──────► diet_template_foods
  ~150ms                    ~150ms                     ~150ms
  Total: ~450ms

AFTER (parallel + conditional):
  nutrition_targets  ┐
                     ├──► diet_template_foods
  assigned_diet_days ┘    ~150ms
  ~150ms (parallel)
  Total: ~300ms
```

### Specific Code Changes

- Lines 55-90: Replace the two sequential awaits with a single `Promise.all([targetsQuery, assignmentQuery])`
- Line 56: Change `setIsLoading(true)` to `setIsLoading(allFoods.length === 0)` to avoid flashing spinner on re-fetches
- Move `todayStr` calculation before the `Promise.all` block
- Destructure both results and proceed with the existing template foods fetch

No other files changed. Pure performance optimization, no behavior change.

