

## Update Pre-Workout Preview UI

### Summary
Update the workout card and list to display `workout_name`, `day_notes`, and exercise-level `rir`/`rpe`/`failure_set` badges from the `assigned_workouts` table's inline data. No changes to the Vision AI workout engine.

### Current State
- `useAssignedWorkouts` joins through `programs.exercises` for exercise data, ignoring the inline `exercises` JSONB, `workout_name`, and `day_notes` columns on `assigned_workouts`.
- `WorkoutCard` shows title, day, exercise count, duration, intensity, coach note, and a start button — no per-exercise detail or RIR/RPE/failure badges.

### Changes

**1. `src/hooks/useAssignedWorkouts.ts`**
- Update `TransformedWorkout` interface: add `rir?: number`, `rpe?: number`, `failureSet?: boolean` to each exercise in `programExercises`.
- In the mapping logic, prefer `aw.workout_name` over `program?.title` for the title.
- Map `aw.day_notes` to `coachNote` (fallback to `program?.description`).
- When building exercise list: merge inline `aw.exercises` JSONB data if it exists (it contains `rir`, `rpe`, `failure_set`). If `aw.exercises` is populated, use it as primary source; otherwise fall back to `programs.exercises`. Map `rir`, `rpe`, `failure_set` onto each exercise object.

**2. `src/components/WorkoutCard.tsx`**
- Add a new prop: `exerciseDetails` — array of `{ name, sets, reps, rir?, rpe?, failureSet? }`.
- Render an expandable exercise list below the stats row (collapsed by default, toggle with chevron).
- Each exercise row shows:
  - Exercise name + `sets × reps`
  - If `failureSet === true`: red/orange badge "🔥 TÜKENİŞ"
  - If `rir` exists (and not failure): pill badge "RIR: {rir}"
  - If `rpe` exists: pill badge "RPE: {rpe}"
- Rename the coach note label from "Koç Notu:" to "Koçun Notu".

**3. `src/pages/Antrenman.tsx`**
- Pass the new `exerciseDetails` prop from `workout.programExercises` to `WorkoutCard`.

### File count: 3 files modified, 0 migrations

