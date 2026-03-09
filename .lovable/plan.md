

## Superset Rest Timer Bypass in VisionAIExecution

### Summary
Add `groupId` to both interfaces and the exercise mapping, then wrap the two rest-timer triggers in `handleConfirmSet` with a superset check that skips rest and immediately advances when consecutive exercises share the same group.

### Changes — `src/components/VisionAIExecution.tsx` only

**1. Interfaces** — Add `groupId?: string` to both `ProgramExercise` (line 23) and `Exercise` (line 46).

**2. Mapping** (line 72) — Add `groupId: ex.groupId` to the exercise mapping.

**3. `handleConfirmSet`** (lines 169-188) — Two injection points:

**a) Exercise-complete branch (line 175):** When all sets of current exercise are done and there's a next exercise, check superset:
```ts
const nextEx = exercises[currentExerciseIndex + 1];
const isSupersetTransition = exercise.groupId && nextEx?.groupId === exercise.groupId;
if (isSupersetTransition) {
  // Skip exercise rest, advance immediately
  setCurrentExerciseIndex(p => p + 1);
  setCurrentSet(1); setTimer(0); setReps(0); setWeight(60); setIsRunning(true);
  toast.info("🔗 Süperset: Dinlenmeden sıradaki harekete geç!");
} else {
  setShowExerciseRestTimer(true);
}
```

**b) Set-complete branch (line 187):** When there are more sets remaining, check if the next exercise in the superset group should be visited first (this is the between-sets rest). This stays as-is — normal set rest within the same exercise is expected even in supersets. Only the **exercise transition** rest is bypassed.

### What is NOT touched
- Pose detection, camera hooks, rep counting, timer mechanisms, state transitions other than the conditional bypass, `RestTimerOverlay` component, `ExerciseRestTimerOverlay` component.

### File count: 1 file modified

