

## Plan: Add Calorie Badges to Workout History & Summary

### Approach
Use the same MET-based calorie algorithm from `useWeeklyWorkoutStats` — compute per-workout calories using duration, user weight, and failure/RIR-0 set count. Add this to both the history list and the post-workout summary screen.

### Changes

**1. `src/hooks/useWorkoutHistory.ts`** — Add `calories` field to `WorkoutHistoryEntry`
- Fetch `current_weight` from `profiles` table (single extra query, run in parallel)
- For each log, compute: `(durationMin / 60) * weightKg * 5.0` (base MET) + `failureSets * 15` (EPOC bonus)
- Add `calories: number` and `durationMinutes: number` to the interface

**2. `src/pages/Antrenman.tsx`** — Two locations:
- **History list item** (line ~598-604): Add a calorie badge next to tonnage, e.g. `🔥 342 kcal` with orange styling
- **Detail modal stats row** (line ~662-675): Change from 3-column to 4-column grid, add a "KALORİ" stat showing `workout.calories`

**3. `src/components/VisionAIExecution.tsx`** — Post-workout summary screen
- Fetch user's `current_weight` from profiles at component mount
- Compute calories from actual completed sets data (duration from timer + failure sets from `completedSetsRef`)
- Add "Yakılan Kalori" row to the summary card (line ~474, after Tonnaj row)

### Calorie Formula (consistent with existing codebase)
```text
Base = (duration_hours) × weight_kg × 5.0 MET
EPOC = failure_set_count × 15 kcal
Total = Base + EPOC
```

### Files Modified
- `src/hooks/useWorkoutHistory.ts`
- `src/pages/Antrenman.tsx`
- `src/components/VisionAIExecution.tsx`

No database changes needed.

