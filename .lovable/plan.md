

## Fix Weight Memory Sync Bug (Phase 3 - Epic 7 - Part 2.1 Hotfix)

### Root Cause
In `handleExerciseRestComplete` and `handleExerciseRestSkip`, `setWeight(getSmartWeight(nextEx.name))` is called **before** `setCurrentExerciseIndex` updates. React batches these state updates, but the weight calculation uses a manually computed `nextIdx` which can desync — especially with superset group bounds logic. The fix: centralize weight sync via a `useEffect` on `currentExerciseIndex`.

### Changes — `src/components/VisionAIExecution.tsx`

**1. Add centralized weight sync effect (after line ~161)**
```typescript
useEffect(() => {
  if (exercises.length > 0 && exercises[currentExerciseIndex]) {
    const w = getSmartWeight(exercises[currentExerciseIndex].name);
    setWeight(w);
  }
}, [currentExerciseIndex, exercises, getSmartWeight]);
```

**2. Remove manual `setWeight` calls from 3 locations:**
- Line 440: `handleExerciseRestComplete` — remove `setWeight(nextEx ? getSmartWeight(nextEx.name) : 0);`
- Line 453: `handleExerciseRestSkip` — remove same line
- Line 474: `goToExercise` — remove `setWeight(targetEx ? getSmartWeight(targetEx.name) : 0)` from the chained call

**3. Keep untouched:**
- `handleSkipRest` (intra-exercise set transitions) — no weight reset
- `handleConfirmSet` storing weight into `lastUsedWeightsRef` — still needed
- Mount effect pre-populating from historical data — still needed (but the new effect will also fire on mount for index 0, providing a backup)

### Files Changed
| File | Action |
|------|--------|
| `src/components/VisionAIExecution.tsx` | Add useEffect, remove 3 manual setWeight calls |

