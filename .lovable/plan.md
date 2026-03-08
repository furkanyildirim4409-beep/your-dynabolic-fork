

# Save Workout Results to Supabase

## Overview
Update `VisionAIExecution.tsx` to accept an `assignmentId` prop and update the `assigned_workouts` status to `'completed'` when saving. Update `Antrenman.tsx` to pass the assignment ID.

## Changes

### 1. `src/components/VisionAIExecution.tsx`
- Add `assignmentId?: string` to the props interface
- In `saveWorkoutLog`, after inserting into `workout_logs`, update `assigned_workouts` status to `'completed'` if `assignmentId` is provided
- Update toast message to "Antrenman başarıyla kaydedildi! +150 Bio-Coin kazandın."
- Call `onClose()` after successful save (currently the button just calls `onClose` without waiting for save)

### 2. `src/pages/Antrenman.tsx`
- Pass `assignmentId={activeWorkout.id}` to `VisionAIExecution`

## `saveWorkoutLog` Updated Flow
```
1. INSERT into workout_logs (existing)
2. UPDATE profiles bio_coins (existing)
3. NEW: UPDATE assigned_workouts SET status='completed' WHERE id=assignmentId
4. toast.success with bio-coin message
5. onClose()
```

Note: The `assigned_workouts` UPDATE policy requires `coach_id = auth.uid()`, meaning athletes can't update their own assignments. We'll need a new RLS policy for athletes to update their own assignment status — or use the existing coach policy. Let me check...

The RLS shows only coaches can update. We need a migration to add an athlete update policy.

## Migration
Add RLS policy: "Athletes can update own assignment status" — allows athletes to UPDATE `assigned_workouts` where `athlete_id = auth.uid()`.

| File | Change |
|---|---|
| `src/components/VisionAIExecution.tsx` | Add `assignmentId` prop, update assigned_workouts in saveWorkoutLog, improve toast, call onClose after save |
| `src/pages/Antrenman.tsx` | Pass `assignmentId={activeWorkout.id}` |
| Migration | Add athlete UPDATE policy on `assigned_workouts` |

