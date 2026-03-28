

## Background-Proof Timer & Audio Beep (Phase 3 - Epic 7 - Part 4/5)

### Analysis

The `useStableTimer` hook **already uses timestamp-based delta time** and has a `visibilitychange` listener that recalculates on return from background. The timer is already background-proof for accuracy. The actual gaps are:

1. **No completion beep** — when timer hits 0, there's no audible alert
2. **RestTimerOverlay** has a `soundEnabled` toggle but no sound implementation
3. **ExerciseRestTimerOverlay** plays countdown ticks (3-2-1) but no final completion beep

### Changes

**File: `src/hooks/useStableTimer.ts`**

Add an `onBeforeComplete` callback option. When the countdown reaches 0, fire `onBeforeComplete` (for the beep) before `onComplete` (which dismisses the overlay). This ensures the beep plays even if the timer expired while backgrounded — the `visibilitychange` → `update()` path will trigger it on unlock.

**File: `src/lib/haptics.ts` (or new `src/lib/audio.ts`)**

Add a `playCompletionBeep()` utility using Web Audio API:
- 800Hz sine wave, 0.4s duration, gain fade-out
- Wrapped in try/catch for environments without AudioContext

**File: `src/components/ExerciseRestTimerOverlay.tsx`**

- Pass `onBeforeComplete` to `useStableTimer` that calls `playCompletionBeep()` + `hapticHeavy()`
- Keep existing 3-2-1 countdown sounds unchanged

**File: `src/components/RestTimerOverlay.tsx`**

- Pass `onBeforeComplete` that calls `playCompletionBeep()` only when `soundEnabled` is true, plus `hapticHeavy()`
- Wire the existing `soundEnabled` toggle to actually control sound

### Technical Detail

```text
Timer fires in background?
  ├─ setInterval throttled by OS → no tick
  ├─ User unlocks phone → visibilitychange fires
  ├─ update() recalculates from timestamp → val = 0
  ├─ onBeforeComplete() → playCompletionBeep()
  └─ onComplete() → dismiss overlay
```

The `useStableTimer` change: in the `update` function, before calling `onCompleteRef.current?.()`, call `onBeforeCompleteRef.current?.()`.

### Files Changed
| File | Action |
|------|--------|
| `src/lib/audio.ts` | New — `playCompletionBeep()` Web Audio utility |
| `src/hooks/useStableTimer.ts` | Add `onBeforeComplete` callback, fire before `onComplete` |
| `src/components/ExerciseRestTimerOverlay.tsx` | Wire completion beep via `onBeforeComplete` |
| `src/components/RestTimerOverlay.tsx` | Wire completion beep with `soundEnabled` gate |

