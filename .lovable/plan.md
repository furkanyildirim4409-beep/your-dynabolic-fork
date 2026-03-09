

## Inject Hypertrophy Cues into Active Workout UI

### Summary
Add conditional RIR, RPE, and Failure badges to the active workout overlay by extending the `ProgramExercise` interface and the exercise mapping, then rendering badges in the info panel. Zero changes to pose detection, timers, state transitions, or camera logic.

### Changes

**1. `src/components/VisionAIExecution.tsx`**

**Interface update** — Add optional fields to `ProgramExercise` (lines 13-21):
```ts
interface ProgramExercise {
  // ...existing fields...
  rir?: number;
  rpe?: number;
  failureSet?: boolean;
}
```

**Exercise mapping update** (lines 55-66) — Carry through the new fields into the `Exercise` interface and mapping:
- Add `rir?: number`, `failureSet?: boolean` to the `Exercise` interface (lines 30-42)
- In the mapping: `rpe: typeof ex.rpe === 'number' ? ex.rpe : 7`, `rir: ex.rir`, `failureSet: ex.failureSet`

**UI injection** — In the info panel (after line 442, below the exercise name), insert:
- If `exercise.failureSet === true`: a pulsing red badge: `🔥 BU SET TÜKENİŞE KADAR!`
- Else if `exercise.rir` is a number: an orange pill: `Hedef RIR: {rir}`
- The existing RPE card (lines 444-453) already shows RPE — it will now use the real value from the coach data instead of the hardcoded `7`.

No other lines are touched. Layout, timers, state, and camera remain untouched.

### File count: 1 file modified

