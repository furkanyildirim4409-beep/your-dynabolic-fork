

## Progressive Overload & Hypertrophy Tracking Enhancement

### Changes — `src/components/VisionAIExecution.tsx` only

**1. Display Target Reps (line ~654)**

Add `Hedef: {exercise.sets}x{exercise.reps}` below the exercise name, next to the workout title text.

**2. Fetch Previous Workout Data**

Add state `previousWorkout` and a `useEffect` that queries `workout_logs` for the most recent completed entry matching `user.id` + `workoutTitle`, ordered by `logged_at desc`, limit 1.

**3. Failure Toggle in Controls (line ~728, before SETİ ONAYLA button)**

Add state `achievedFailure`. When `exercise.failureSet` is true, render a Switch/Checkbox row: `"Tükenişe Ulaştım"`. Reset `achievedFailure` to false on exercise/set transitions.

Update `handleConfirmSet` (line 176-179) to use `achievedFailure` instead of hardcoded `false`:
```
isFailure: achievedFailure || false
```

**4. Enrich `saveWorkoutLog` details payload (lines 273-280)**

Replace the simple `details` mapping with the enriched payload that includes:
- `targetSets`, `targetReps`, `rir`, `failure_set`, `groupId`
- `weightDiff` — computed by comparing max weight per exercise against `previousWorkout.details`
- `rirSuccess` — whether last set reps met target

**5. Reset `achievedFailure` on transitions**

In rest handlers and exercise transitions (lines 336, 348, 359, 368, 388), reset `setAchievedFailure(false)`.

### No changes to timer logic, superset state machine, camera, or sound effects.

