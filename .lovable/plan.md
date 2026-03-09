

## Active Workout Engine

### Summary
Build a full-screen active workout screen where athletes complete sets one-by-one with RIR/failure prompts, rest timer integration, and automatic completion flow that marks `assigned_workouts.status = 'completed'` and logs to `workout_logs`.

### Changes

**1. `src/components/ActiveWorkoutEngine.tsx` — New (main component, ~350 lines)**

Full-screen overlay replacing the workout detail sheet when athlete taps "ANTRENMANI BAŞLAT".

**State model:**
```text
currentExerciseIndex: number
currentSetIndex: number
completedSets: Map<exerciseIndex, Set<setIndex>>
showRestTimer: boolean
workoutStartTime: Date
isCompleting: boolean
```

**Per-exercise view:**
- Large exercise name at top, current set indicator ("Set 2 / 4")
- Below: `sets × reps` display with large font for sweaty-hand readability
- **RIR prompt**: If `rir` is set, show a teal banner: "Hedef: {rir} Tekrar Kala Bırak"
- **Failure prompt**: If `failure_set === true`, show a pulsing orange/red banner: "🔥 BU SET TÜKENİŞE KADAR!"
- Exercise notes shown below if present
- Large "SETİ BİTİR" button (min-h-16, full width) at bottom

**On "SETİ BİTİR" click:**
- Mark set as completed in local state
- If more sets remain for this exercise → open RestTimerOverlay with exercise's `restTime` (parse "90s" → 90)
- If all sets done for this exercise → advance to next exercise (show rest timer between exercises)
- If all exercises done → trigger completion flow

**Navigation:**
- Top bar: workout title, elapsed timer (mm:ss), X to quit (with confirmation dialog)
- Exercise list sidebar/strip at bottom showing progress dots per exercise
- Swipe or tap to navigate between exercises (but guided flow is primary)

**2. `src/components/WorkoutCompletionModal.tsx` — New (~80 lines)**

Shown when all exercises are completed:
- Confetti (canvas-confetti already installed)
- Summary: duration, exercises completed, total sets
- "ANTRENMANI KAYDET" button that:
  - Updates `assigned_workouts.status = 'completed'` via supabase
  - Inserts into `workout_logs` (workout_name, user_id, duration_minutes, exercises_count, completed: true, details: JSON of completed sets)
  - Invalidates `assigned-workouts` query cache
  - Shows success toast and closes

**3. `src/components/WorkoutDetailSheet.tsx` — Enable the start button**

- Remove `disabled` from "ANTRENMANI BAŞLAT"
- Add `onStartWorkout` prop, wire button to it
- Remove "(Yakında)" text

**4. `src/pages/Antrenman.tsx` — Wire up engine**

- Add `activeWorkout` state
- When `onStartWorkout` fires from detail sheet, close detail sheet and open `ActiveWorkoutEngine`
- Pass workout data and `onComplete` callback

**5. Reuse existing `RestTimerOverlay.tsx`** — No changes needed, already has all required features (skip, pause, presets, next exercise preview)

### UX Details

- All tap targets minimum 48px height for sweaty hands
- Exercise progress shown as filled/unfilled dots
- Elapsed time runs in top bar from workout start
- Quit confirmation: "Antrenmanı bitirmek istediğine emin misin? İlerleme kaydedilmeyecek."
- Rest timer auto-opens with correct seconds parsed from exercise `restTime` field

### File count: 3 new, 2 modified, 0 migrations

