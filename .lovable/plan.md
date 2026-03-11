

## Real Dates & Exercise-Level Progression

### 1. Fix Workout Dates (`useAssignedWorkouts.ts`)

Currently `day_of_week` is used as the primary label, and `scheduled_date` is only a fallback. Reverse the priority:

- If `scheduled_date` exists, format it as `"d MMMM EEEE"` (e.g., "16 Mart Pazartesi") and use it as `day` label
- Add `scheduledDate: string | null` to `TransformedWorkout` interface for date comparison
- `completedToday` stays the same — only true when logs exist for today
- Sort by `scheduled_date` (ascending) instead of `day_of_week` order

### 2. Fix Grouping in `Antrenman.tsx`

- Group by `scheduledDate` (the raw date string) instead of `dayOfWeek`
- `isToday` check: compare `scheduledDate` against today's date string (`format(new Date(), 'yyyy-MM-dd')`)
- Show "BUGÜN" badge only when `scheduledDate === todayStr`
- For workouts without a `scheduledDate`, fall back to `dayOfWeek` grouping (backward compat)
- Today's group remains expanded at top; others remain collapsible

### 3. Exercise-Level Progression in History Detail Modal

In the workout detail modal (lines 538-589), when rendering each exercise accordion:

- Use the existing `useExerciseHistory` hook (global PR map) to get the all-time PR for each exercise
- Find the *previous* occurrence of the same exercise from `workoutHistory` entries that are older than the current one
- Compare weights per exercise:
  - If max weight in this session > previous session max weight: show `🟩 +X kg` badge
  - If max weight equals global PR's maxWeight: show `🏆 YENİ REKOR` badge
  - Otherwise: no badge
- Add these badges inline next to the exercise name in the accordion trigger

### Files Modified
- `src/hooks/useAssignedWorkouts.ts` — add `scheduledDate`, prioritize it for `day` label, sort by date
- `src/pages/Antrenman.tsx` — group by date, today detection via date string, exercise progression badges in history detail

