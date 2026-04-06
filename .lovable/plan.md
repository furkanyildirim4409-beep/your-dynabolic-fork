
# Biometric Twin Engine — Part 1: Slider Math & Parametric SVG Skeleton

## Changes

### 1. Fix Slider Direction (`BiometricTwin.tsx`)

Currently `history` is sorted DESC (index 0 = newest). The slider value 0 maps to newest, which is counterintuitive (left = newest, right = oldest).

**Fix:** Reverse the index mapping. Keep `history` as-is (DESC from DB), but compute the chronological index:

```typescript
// history[0] = newest, history[last] = oldest
// slider 0 = oldest, slider max = newest
const chronoIndex = history.length - 1 - sliderValue[0];
const currentRecord = history[chronoIndex];
```

- Default `sliderValue` resets to `[history.length - 1]` (rightmost = newest)
- Labels: Left = "En Eski", Right = "En Yeni" (swap current order)

### 2. Create `src/components/athlete-detail/ParametricBodySVG.tsx`

A new component that accepts `measurements: BodyMeasurement | null` and renders a structured SVG silhouette with grouped body parts:

- `<g id="head">` — ellipse head
- `<g id="neck">` — neck rect
- `<g id="torso">` — shoulders + chest + torso path
- `<g id="waist">` — waist region with dashed guide ellipse
- `<g id="hips">` — hip region with dashed guide ellipse
- `<g id="left-arm">` / `<g id="right-arm">` — arm paths
- `<g id="left-leg">` / `<g id="right-leg">` — leg paths

Each group uses `transform-origin` centered on its own axis so future parts can apply `scaleX` based on measurement deltas. For Part 1, no morphing — just clean rendering with the same visual quality as the current inline SVG.

High-tech styling additions: subtle scan-line overlay, faint grid pattern in background, pulsing glow on the torso centerline.

### 3. Integrate into `BiometricTwin.tsx`

- Replace the inline SVG block (lines 100-126) with `<ParametricBodySVG measurements={currentRecord} />`
- Import the new component

## Files

| Action | File |
|--------|------|
| Create | `src/components/athlete-detail/ParametricBodySVG.tsx` |
| Edit   | `src/components/athlete-detail/BiometricTwin.tsx` |
