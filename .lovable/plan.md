

## Restructure Vision AI UI Layout

Three changes in `src/components/VisionAIExecution.tsx`, no logic modifications:

### 1. Delete standalone Koç Hedefi block (lines 768-779)
Remove the floating `exercise.failureSet ? ... : exercise.rirPerSet ? ...` block entirely.

### 2. Update KOÇ HEDEFİ box content (line 796)
Replace the static `{exercise.targetReps}x @ {exercise.tempo}` with dynamic format:
```jsx
<p className="text-primary font-display text-sm leading-tight">
  {exercise.reps}x @ {exercise.failureSet 
    ? 'FAILURE' 
    : (exercise.rirPerSet?.length > 0) 
      ? exercise.rirPerSet.join('-') + ' RIR'
      : typeof exercise.rir === 'number' 
        ? Array(Number(exercise.sets) || 1).fill(exercise.rir).join('-') + ' RIR'
        : exercise.tempo}
</p>
```

### 3. Move Failure button (lines 857-864) up after RPE/KOÇ HEDEFİ row
Move the liquid glass failure button from its current position (above SETİ ONAYLA) to right after the `</div>` closing the flex RPE/KOÇ HEDEFİ row (after line 798), with `mt-2 mb-1` spacing. Remove it from its old location.

**Result layout order:**
1. Exercise name + history button
2. HEDEF RPE + KOÇ HEDEFİ boxes (side by side)
3. 🔥 TÜKENİŞE ULAŞTIM button (if failureSet)
4. Coach notes (if any)
5. Weight / Timer / Reps selectors
6. Previous record indicator
7. SETİ ONAYLA button

