

# Biometric Twin Engine — Part 4: Final Synchronization & Badge Tracking

## Summary
Add animated number transitions to badges, render SVG connector lines from badges to body parts, and handle null/zero edge cases gracefully.

## Changes

### 1. Edit `src/components/athlete-detail/BiometricTwin.tsx`

**Animated badge values**: Replace static text values with `<motion.span>` using Framer Motion's `key` trick — when the value changes, the number fades/slides in:
```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={val}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.25 }}
  >
    {val}
  </motion.span>
</AnimatePresence>
```

**SVG connector lines**: Add a lightweight SVG layer (absolute positioned, same dimensions as the badge container) that draws dashed lines from each badge's `lineX/lineY` coordinates to the badge position. These use the existing `lineX`/`lineY` fields already defined in the badge config. Render as a `<svg>` overlay with `pointer-events-none`.

**Delta indicator**: When `history.length > 1` and the slider is at the newest record, compute the delta between current and previous measurement. Show a small green/red arrow (▲/▼) next to the value indicating improvement or regression.

**Slider default**: Already defaults to `[history.length - 1]` (newest) — verified correct. No change needed.

### 2. Edge case handling (already covered but verify)

The `scaleFor` function in `biometricScaleEngine.ts` already returns `1` for null/zero values. The `getValue` function already returns "—" for null/zero. No changes needed here.

### 3. Realtime refresh after adding measurement

The `useBodyMeasurements` hook already has a realtime subscription on `INSERT` events that triggers `fetchData()`. When "Yeni Ölçüm Ekle" saves a new record, the subscription fires, history updates, and the slider's `useEffect` resets to `[history.length - 1]` (newest). Already working — no changes needed.

## Files

| Action | File |
|--------|------|
| Edit | `src/components/athlete-detail/BiometricTwin.tsx` |

