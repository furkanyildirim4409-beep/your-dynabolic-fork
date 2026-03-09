

## Update Athlete Schedule & Workout View

### Summary
Rewrite `useAssignedWorkouts` to query the new flat `assigned_workouts` structure (which now stores `workout_name`, `day_notes`, and `exercises` JSONB directly per row), group workouts by date, and update the UI to show exercise details with RIR badges and failure set indicators.

### Changes

**1. `src/hooks/useAssignedWorkouts.ts` — Rewrite query & types**
- Remove the `programs(*, exercises(*))` join. Query `assigned_workouts` directly: `select("*")` filtered by `athlete_id` and `status = 'pending'`, ordered by `scheduled_date` asc.
- Update `TransformedWorkout` interface:
  - `title` ← `workout_name` (not program title)
  - `coachNote` ← `day_notes`
  - `programExercises` parsed from the `exercises` JSONB column with fields: `name`, `sets`, `reps`, `rir`, `failure_set`, `rest_time`, `notes`, `video_url`
  - Add `scheduledDate: string | null` for grouping
- Add a new exported type for the exercise shape:
```ts
export interface WorkoutExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rir?: number | null;
  failure_set?: boolean;
  restTime: string;
  notes: string | null;
  videoUrl: string | null;
}
```
- Add a helper `groupByDate(workouts)` returning `{ today: [], tomorrow: [], upcoming: [] }` using `isToday`/`isTomorrow` from date-fns.

**2. `src/pages/Antrenman.tsx` — Grouped display + exercise detail**
- Import `groupByDate` from the hook, group workouts into Today / Tomorrow / Upcoming sections with section headers.
- Each `WorkoutCard` already receives `coachNote` — ensure it displays `day_notes`.
- When user clicks "GÖREVİ BAŞLAT" (which currently opens VisionAIExecution), instead show a **workout detail sheet** (not the play engine). This is a bottom sheet showing:
  - Workout title + date + coach note callout
  - Exercise list with: `sets × reps`, RIR badge (small pill `"RIR: {n}"`), failure set badge (orange/red `"🔥 TÜKENİŞ"`), and exercise-level notes underneath.
  - A disabled "ANTRENMANI BAŞLAT" button at the bottom (placeholder for future).

**3. `src/components/WorkoutCard.tsx` — Minor updates**
- No structural changes needed; it already handles `coachNote` display and title. Will just pass through the new data.

**4. `src/components/WorkoutDetailSheet.tsx` — New component**
- Bottom sheet (motion div, drag-to-dismiss) displaying the full exercise list for a selected workout.
- Each exercise row:
  - Name (bold), notes underneath in muted text
  - Right side: `{sets} × {reps}`
  - Badges: `RIR: {n}` pill in blue/teal if present, `🔥 TÜKENİŞ` pill in orange if `failure_set === true`
- Coach note shown at top as a yellow alert/callout (reuse existing pattern from WorkoutCard).
- "ANTRENMANI BAŞLAT" button at bottom, disabled with tooltip "Yakında".

**5. `src/pages/Kokpit.tsx` — NextMissionCard dynamic data**
- Import `useAssignedWorkouts`, find the first workout for today, pass its `workout_name` and `duration` to `NextMissionCard` instead of hardcoded "GÖĞÜS & SIRT".
- If no workout today, hide the card or show rest message.

### File count: 4 files modified, 1 file created

