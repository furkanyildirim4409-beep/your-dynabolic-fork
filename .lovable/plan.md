

## Free-Roam State Rehydration V2 (Phase 3 - Epic 7 - Part 3/5 Fix)

### Root Cause of V1 Crash
The previous attempt put `setReps`, `setCurrentSet`, `setAchievedFailure` inside a `useEffect` depending on `exercises` and `getSmartWeight` — both of which are derived/memoized values that can retrigger on every render, causing an infinite loop.

### V2 Strategy: Imperative Rehydration (No useEffect)

Replace the problematic centralized `useEffect` (lines 164-169) and all scattered manual resets with a single imperative function called at each navigation point.

---

### Changes — `src/components/VisionAIExecution.tsx`

**1. Add `setsVersion` state (after line 125)**
```typescript
const [setsVersion, setSetsVersion] = useState(0);
```

**2. Define `rehydrateExerciseState` function (after `getSmartWeight`, ~line 146)**
```typescript
const rehydrateExerciseState = useCallback((index: number) => {
  const ex = exercises[index];
  if (!ex) return;
  setWeight(getSmartWeight(ex.name));
  const pastSets = completedSetsRef.current[index]?.length ?? 0;
  setCurrentSet(pastSets < ex.sets ? pastSets + 1 : ex.sets);
  setReps(0);
  setAchievedFailure(false);
}, [exercises, getSmartWeight]);
```

**3. Remove the centralized `useEffect` (lines 163-169)**
Delete the entire `useEffect` block that syncs on `currentExerciseIndex`. Weight + set sync will now be handled imperatively.

**4. Update `handleConfirmSet` (line 253, after storing weight)**
Add `setSetsVersion(v => v + 1);` to trigger UI re-render for the completed sets log.

**5. Update `goToExercise` (line 474-478)**
Replace the manual state resets with a call to `rehydrateExerciseState`:
```typescript
const goToExercise = (index: number) => {
  setCurrentExerciseIndex(index);
  rehydrateExerciseState(index);
  resetTimer();
  resumeTimer();
  setTimeout(() => setSwipeDirection(null), 300);
};
```

**6. Update `handleExerciseRestComplete` (line 444-452)**
Remove `setReps(0); setCurrentSet(1); setAchievedFailure(false);` and instead call `rehydrateExerciseState` with the computed next index:
```typescript
const handleExerciseRestComplete = () => {
  setShowExerciseRestTimer(false); resetTimer();
  let nextIdx: number;
  if (exercise.groupId) {
    const { lastGroupIdx } = getGroupBounds(exercise.groupId);
    nextIdx = lastGroupIdx + 1;
  } else {
    nextIdx = currentExerciseIndex + 1;
  }
  setCurrentExerciseIndex(nextIdx);
  rehydrateExerciseState(nextIdx);
  resumeTimer();
};
```

**7. Update `handleExerciseRestSkip` (line 454-462)** — same pattern as above.

**8. DO NOT touch `handleRestComplete` / `handleSkipRest` (lines 422-442)**
These handle intra-exercise set transitions (same exercise, next set) — weight must persist, set increments by 1. No rehydration needed.

**9. Fix progress dots "done" logic (line 674)**
```typescript
// Before:
const isDone = index < currentExerciseIndex;
// After:
const setsCompleted = completedSetsRef.current[index]?.length ?? 0;
const isDone = setsCompleted >= exercises[index].sets;
```

**10. Fix exercise list sheet "done" logic (line 967)**
Same ref-based check replacing `index < currentExerciseIndex`.

**11. Add completed sets log (before Controls area, ~line 824)**
Render completed sets from `completedSetsRef` for the current exercise, using `setsVersion` as a render key:
```tsx
{(completedSetsRef.current[currentExerciseIndex]?.length ?? 0) > 0 && (
  <div className="space-y-1" key={setsVersion}>
    {completedSetsRef.current[currentExerciseIndex].map((s, i) => (
      <div key={i} className="flex items-center justify-between px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs">
        <span className="text-muted-foreground">Set {i + 1}</span>
        <span className="text-foreground font-display">{s.weight} kg × {s.reps}</span>
        {s.isFailure && <span className="text-red-400">🔥</span>}
      </div>
    ))}
  </div>
)}
```

### Files Changed
| File | Action |
|------|--------|
| `src/components/VisionAIExecution.tsx` | Imperative rehydration, setsVersion, completed sets log, fix done detection |

