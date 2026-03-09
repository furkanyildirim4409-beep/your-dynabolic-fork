

## True Alternating Superset Logic — Rewrite `handleConfirmSet`

### Problem
Current logic completes ALL sets of Exercise A before moving to B. True supersets alternate: A1→B1→REST→A2→B2→REST.

### Changes — `src/components/VisionAIExecution.tsx` only

**1. Rewrite `handleConfirmSet` (lines 158-204)**

Replace the current function body with this state machine:

```
handleConfirmSet():
  1. Track completed set (unchanged)
  2. Show confirm animation, stop timer (unchanged)

  3. Determine group boundaries:
     - If exercise.groupId exists:
       firstGroupIdx = first exercise in array with same groupId
       lastGroupIdx  = last exercise in array with same groupId

  4. After animation timeout:
     IF exercise has groupId (superset member):
       CASE A — Mid-round (currentExerciseIndex < lastGroupIdx):
         → setCurrentExerciseIndex(p => p + 1)
         → Keep currentSet unchanged
         → Reset timer/reps, setIsRunning(true)
         → toast.info("🔗 Süperset: Dinlenmeden sıradaki harekete geç!")

       CASE B — End of round, more sets remain (index === lastGroupIdx && currentSet < exercise.sets):
         → setShowRestTimer(true)  // normal between-set rest
         → After rest completes: jump back to firstGroupIdx, increment set
         (handled by modifying rest complete handlers — see point 2 below)

       CASE C — End of round, all sets done (index === lastGroupIdx && currentSet >= exercise.sets):
         → If lastGroupIdx + 1 < exercises.length: setShowExerciseRestTimer(true)
         → Else: save & show summary

     ELSE (no group — standard):
       Same as current fallback logic
```

**2. Modify rest timer completion handlers (lines 290-293)**

The `handleRestComplete` currently always increments `currentSet` and stays on same exercise. For superset Case B, after rest we need to jump back to `firstGroupIdx` and increment set.

Update `handleRestComplete` and `handleSkipRest`:
- Check if current exercise has a `groupId`
- If yes: find `firstGroupIdx`, jump to it, increment set
- If no: keep current behavior (stay on same exercise, increment set)

**3. Modify `handleExerciseRestComplete` and `handleExerciseRestSkip` (lines 292-293)**

For superset Case C, the next exercise index should be `lastGroupIdx + 1`, not `currentExerciseIndex + 1`. Update:
- Check if current exercise has a `groupId`
- If yes: find `lastGroupIdx`, set index to `lastGroupIdx + 1`
- If no: keep `p => p + 1`

### What is NOT touched
- Camera, pose detection, timer tick logic, UI overlays, sound effects, achievement triggers, save logic, animation code.

### File count: 1 file modified

