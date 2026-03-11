

## Recurring Workout Programs — Athlete App Execution

### Problem
Currently, completing a workout sets `assigned_workouts.status = 'completed'`, and the fetch query filters by `status = 'pending'` — causing the workout to vanish permanently. For recurring weekly programs using `day_of_week`, workouts must persist and reappear every week.

### Changes

**1. `src/hooks/useAssignedWorkouts.ts` — Remove status filter, use `day_of_week` for grouping**
- Remove `.eq("status", "pending")` filter entirely
- Instead, fetch all `assigned_workouts` for the athlete (recurring rows never get deleted)
- Use `day_of_week` as the primary day label (e.g., "Pazartesi", "Salı") instead of `scheduled_date`
- Add a `completedToday` boolean to `TransformedWorkout` by cross-checking `workout_logs` for today's date with matching `assigned_workout_id` or workout name
- Sort workouts by day-of-week order (Pazartesi=1 → Pazar=7)

**2. `src/components/VisionAIExecution.tsx` (line ~373-378) — Stop marking assignment as completed**
- Remove the `UPDATE assigned_workouts SET status = 'completed'` call entirely
- The `workout_logs` INSERT (already present at line 335-347) is the session record — that's sufficient
- Add `assigned_workout_id` to the `workout_logs` INSERT so we can track which assignment was executed (requires a small migration)

**3. Database Migration — Add `assigned_workout_id` to `workout_logs`**
```sql
ALTER TABLE workout_logs 
ADD COLUMN assigned_workout_id uuid REFERENCES assigned_workouts(id) ON DELETE SET NULL;
```
This links each session log back to the recurring assignment.

**4. `src/components/WorkoutCard.tsx` — Add "Bugün Tamamlandı" badge**
- Accept a new `completedToday?: boolean` prop
- When true, show a green `CheckCircle2` badge with "Bugün Tamamlandı" text
- Keep the "Başla" button visible but optionally show "Tekrar Başla" label

**5. `src/pages/Antrenman.tsx` — Weekly schedule grouped by day**
- Group workouts by `day_of_week` in a fixed weekly order
- Show day headers (Pazartesi, Salı, etc.) with workouts nested under each
- Highlight today's day section
- Pass `completedToday` to each `WorkoutCard`

**6. `src/hooks/useAssignedWorkouts.ts` — Fetch today's completions**
- Query `workout_logs` for today's date to get list of completed `assigned_workout_id`s
- Merge into workout data as `completedToday` flag

### Data Flow
```text
assigned_workouts (day_of_week = "Pazartesi", persistent)
       │
       ├── Athlete taps "Başla" → VisionAIExecution
       │
       └── On finish → INSERT workout_logs (assigned_workout_id = X)
                        (NO update to assigned_workouts.status)
       │
       └── Next fetch → check workout_logs for today → show badge
```

### Files Modified
- `supabase/migrations/` — new migration for `assigned_workout_id` column
- `src/hooks/useAssignedWorkouts.ts` — recurring fetch + today's completion check
- `src/components/VisionAIExecution.tsx` — remove status update, add `assigned_workout_id` to log
- `src/components/WorkoutCard.tsx` — `completedToday` badge
- `src/pages/Antrenman.tsx` — weekly grouped view

