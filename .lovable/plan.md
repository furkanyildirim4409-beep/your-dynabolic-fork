

## Fix Smart Weight Algorithm (Phase 3 - Epic 7 - Part 2.2 Hotfix)

### Problem
`lastUsedWeights` captures the **first** valid weight in the sets array (often a warm-up set, e.g. 90kg) instead of the **last** valid weight (the true working weight, e.g. 150kg).

### Change — `src/hooks/useExerciseHistory.ts` (lines 49-57)

Split the single `for (const s of sets)` loop into two concerns:

1. **Last Used Weight** — reverse-iterate `sets` to find the final valid weight from the most recent workout
2. **PR tracking** — forward-iterate as before

```typescript
// 1. Last Used Weight: take the LAST valid set weight (reverse scan)
if (!lastUsedWeights.has(name) && sets.length > 0) {
  for (let i = sets.length - 1; i >= 0; i--) {
    const w = Number(sets[i].weight) || 0;
    if (w > 0) {
      lastUsedWeights.set(name, w);
      break;
    }
  }
}

// 2. PR tracking (unchanged forward loop)
for (const s of sets) {
  const w = Number(s.weight) || 0;
  const r = Number(s.reps) || 0;
  if (w <= 0) continue;
  const existing = prMap.get(name);
  if (!existing || w > existing.maxWeight || (w === existing.maxWeight && r > existing.repsAtMax)) {
    prMap.set(name, { maxWeight: w, repsAtMax: r, date: log.logged_at ?? "" });
  }
}
```

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useExerciseHistory.ts` | Reverse-scan sets for lastUsedWeights |

