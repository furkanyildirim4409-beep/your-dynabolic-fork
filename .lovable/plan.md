

# Fix "Stuck Weight" Bug in VisionAIExecution

## Problem
The `exercises` array is recreated every render, causing the historical-weight `useEffect` to re-fire on every timer tick and continuously reset `weight` to the first exercise's value.

## Changes — Single file: `src/components/VisionAIExecution.tsx`

### 1. Add `useMemo` to imports (line 1)
Change `import { useState, useEffect, useRef, useCallback }` → add `useMemo`.

### 2. Memoize `exercises` (lines 90-105)
Wrap the `(propExercises ?? []).map(...)` in `useMemo(() => ..., [propExercises])` so it only recomputes when props actually change.

### 3. Add initialization guard & fix useEffect (lines 150-163)
- Add `const isInitialized = useRef(false);` before the effect.
- Gate the `setWeight` call with `!isInitialized.current`, then set `isInitialized.current = true` after.
- This ensures the initial weight is set exactly once, not on every timer tick.

## What stays untouched
- All navigation logic, `rehydrateExerciseState`, rest timers, saving, UI
- `getSmartWeight`, `lastUsedWeightsRef`, PR tracking

