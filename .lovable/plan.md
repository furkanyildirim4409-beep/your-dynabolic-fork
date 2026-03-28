

## Workout Engine V2 - Smart Weight Memory (Phase 3 - Epic 7 - Part 2/5)

### Problem
Weight input hardcoded to `60` on every exercise transition, exercise jump, and rest completion. Users must manually re-enter their working weight every single time.

### Current State (5 hardcoded resets found)
- Line 108: `useState(60)` — initial state
- Line 412: `handleExerciseRestComplete` — `setWeight(60)`
- Line 422: `handleExerciseRestSkip` — `setWeight(60)`
- Line 442: `goToExercise` — `setWeight(60)`
- Lines 250-255: superset mid-round advance — resets `reps` but not `weight` (this one is OK)

### Solution: Two-Layer Weight Memory

**Layer 1 — Intra-Workout Memory (session state)**
- New ref: `lastUsedWeightsRef = useRef<Record<string, number>>({})` keyed by exercise name
- Updated in `handleConfirmSet`: after pushing to `completedSetsRef`, also store `lastUsedWeightsRef.current[exercise.name] = weight`
- All transition points (`handleExerciseRestComplete`, `handleExerciseRestSkip`, `goToExercise`) read from this ref instead of hardcoding `60`

**Layer 2 — Historical Memory (DB-backed, pre-populated on mount)**
- Extend `useExerciseHistory` hook to also return `lastUsedWeights: Map<string, number>` — the most recent weight used per exercise (from the most recent workout log, not the PR)
- Since data is already sorted `descending` by `logged_at`, the first weight encountered for each exercise IS the most recent
- Pre-populate `lastUsedWeightsRef` on mount from this historical data

**Weight Resolution Logic** (applied at every transition):
```text
resolveWeight(exerciseName) =
  1. lastUsedWeightsRef[exerciseName]  →  intra-session (highest priority)
  2. historicalLastWeights[exerciseName]  →  from DB
  3. 0  →  fallback (empty input, user types fresh)
```

### Changes

**1. `src/hooks/useExerciseHistory.ts`**
- Add a second `Map<string, number>` called `lastUsedWeights` to the return value
- During the existing loop, track the first (most recent) weight seen per exercise name
- Return both maps: `{ prMap, lastUsedWeights }`

**2. `src/components/VisionAIExecution.tsx`**

State changes:
- Add `lastUsedWeightsRef = useRef<Record<string, number>>({})`
- Destructure `lastUsedWeights` from the updated `useExerciseHistory` hook
- Add a `useEffect` that pre-populates `lastUsedWeightsRef` from historical data on load, and sets the initial weight for the first exercise

Helper function:
- `getSmartWeight(name: string): number` — checks ref first, then historical map, falls back to `0`

Update all transition points:
- `handleConfirmSet`: after recording set, store weight in ref
- `handleExerciseRestComplete`: replace `setWeight(60)` with `setWeight(getSmartWeight(nextExercise.name))`
- `handleExerciseRestSkip`: same replacement
- `goToExercise(index)`: same replacement using `exercises[index].name`
- Initial `useState(60)` stays but gets overridden by the mount `useEffect`

Intra-exercise set persistence:
- `handleSkipRest` (between sets of SAME exercise) already does NOT reset weight — no change needed
- Superset mid-round advance (line 250-255) already preserves weight — no change needed

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useExerciseHistory.ts` | Add `lastUsedWeights` map to return |
| `src/components/VisionAIExecution.tsx` | Smart weight resolution at all transition points |

