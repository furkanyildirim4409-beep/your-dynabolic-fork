

# Feed Real Exercises to VisionAIExecution

## Changes

### 1. `src/pages/Antrenman.tsx`
- Change `activeWorkout` state from `string | null` to `TransformedWorkout | null`
- In `WorkoutCard` mapping: `onStart={() => setActiveWorkout(workout)}` (pass full object)
- In `VisionAIExecution` render: pass `workoutTitle={activeWorkout.title}`, `exercises={activeWorkout.programExercises}`, `onClose={() => setActiveWorkout(null)}`

### 2. `src/components/VisionAIExecution.tsx`
- Add `exercises` prop: `exercises?: Array<{ id: string; name: string; sets: number; reps: string; restTime: string; notes: string | null; videoUrl: string | null }>`
- Remove `import { detailedExercises, assignedWorkouts } from "@/lib/mockData"`
- Delete `getFilteredExercises` function entirely
- Map incoming exercises to the internal `Exercise` interface with safe fallbacks:

```ts
const mappedExercises: Exercise[] = (propExercises ?? []).map(ex => ({
  id: ex.id,
  name: ex.name,
  sets: ex.sets ?? 3,
  targetReps: parseInt(ex.reps) || 10,
  reps: parseInt(ex.reps) || 10,
  tempo: "3-1-2",
  restDuration: parseInt(ex.restTime) || 60,
  rpe: 7,
  notes: ex.notes ?? undefined,
  category: undefined,
  videoUrl: ex.videoUrl ?? undefined,
}));
```

- Use `mappedExercises` instead of `getFilteredExercises(workoutTitle)` on line 49
- For `ExerciseRestTimerOverlay`, use `parseInt(reps)` for `nextExerciseReps` since reps is now a string

### Files Changed

| File | Change |
|---|---|
| `src/pages/Antrenman.tsx` | Pass full workout object to VisionAI |
| `src/components/VisionAIExecution.tsx` | Accept exercises prop, remove mock imports, map with fallbacks |

