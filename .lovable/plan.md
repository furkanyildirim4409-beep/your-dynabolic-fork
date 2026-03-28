

## Enhance Next Exercise Preview Card (Phase 3 - Epic 7 - Part 1.5)

### Summary
Enlarge the "Sıradaki Hareket" card in `ExerciseRestTimerOverlay` and display the exercise GIF/video thumbnail.

### Changes

**1. `ExerciseRestTimerOverlay.tsx` — Add `nextExerciseVideoUrl` prop**

- Add `nextExerciseVideoUrl?: string` to `ExerciseRestTimerOverlayProps`
- Enlarge the preview card: `p-4` → `p-5`, thumbnail from `w-14 h-14` → `w-24 h-24`
- Replace the static `Dumbbell` icon with the exercise GIF when `nextExerciseVideoUrl` is provided:
  - Render `<img>` with `loading="lazy" decoding="async" crossOrigin="anonymous"` and `object-contain` styling
  - Fallback to `Dumbbell` icon on error or if no URL
- Keep glassmorphic styling, add `rounded-2xl` to outer card

**2. `VisionAIExecution.tsx` — Pass `nextExerciseVideoUrl`**

- At the `<ExerciseRestTimerOverlay>` usage (line ~891), add:
  ```
  nextExerciseVideoUrl={computedNextExercise?.videoUrl ?? undefined}
  ```

### Files Changed
| File | Action |
|------|--------|
| `src/components/ExerciseRestTimerOverlay.tsx` | Add prop + enlarge card + render GIF |
| `src/components/VisionAIExecution.tsx` | Pass `nextExerciseVideoUrl` prop |

