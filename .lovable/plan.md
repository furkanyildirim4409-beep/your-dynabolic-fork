

## Fix Next Exercise Preview in Superset Rest Timers

### Problem
Rest timer overlays naively use `exercises[currentExerciseIndex + 1]` for the "next exercise" preview. During supersets, after completing the last exercise in a round (e.g., B1), the rest timer incorrectly shows exercise C instead of exercise A (the loop-back target).

### Changes — `src/components/VisionAIExecution.tsx` only

**1. Add `computedNextExercise` variable** (before the return statement, ~line 395)

Compute the correct next exercise using `getGroupBounds`:
- Mid-superset round → next in array
- End of superset round, more sets → loop back to `firstGroupIdx`
- Superset fully done → `lastGroupIdx + 1`
- Non-superset with sets remaining → same exercise
- Non-superset done → next in array

**2. Update RestTimerOverlay prop** (line 677)

Replace `exercises[currentExerciseIndex + 1].name` with `computedNextExercise?.name`.

**3. Update ExerciseRestTimerOverlay props** (lines 688-690)

Replace `exercises[currentExerciseIndex + 1]` references with `computedNextExercise` for name, sets, and reps.

### File count: 1 file modified

