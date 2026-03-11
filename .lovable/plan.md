

## Global Exercise P.R. Tracking

### Problem
`useExerciseHistory` filters by `workout_name`, so "Bench Press" done on different days shows different max weights. Need a global all-time PR per exercise.

### Changes

**1. `src/hooks/useExerciseHistory.ts` — Global PR query**
- Remove `workoutName` parameter entirely; accept no workout filter
- Query ALL `workout_logs` for the user (no `.eq("workout_name", ...)`)
- Scan every log's `details` JSON to find the absolute max weight per exercise across all history
- Track the reps achieved at that max weight and the date
- Return `Map<exerciseName, { maxWeight, repsAtMax, date }>`
- Change query key to `["exercise-global-pr", user?.id]`
- Only enabled when `user?.id` exists

**2. `src/components/VisionAIExecution.tsx` — Global PR badge**
- Import and call updated `useExerciseHistory()` (no args)
- Replace the "Geçen Hafta" badge block (lines 837-859) with:
  - Lookup current exercise name in the global PR map
  - Show `🏆 Kişisel Rekor: {maxWeight} kg × {repsAtMax} tekrar`
  - If current `weight > globalPR.maxWeight`: show celebratory `🔥 YENİ REKOR!` badge instead, with confetti-style animation
  - If equal or below: show the standard PR reference badge
- Remove the `previousWorkout` state and the useEffect that fetches by `workoutTitle` (lines 103, 109-123) since the hook now handles this globally

### Files
- `src/hooks/useExerciseHistory.ts` — rewrite to global scan
- `src/components/VisionAIExecution.tsx` — new PR badge UI, remove old fetch

