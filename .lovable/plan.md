

# GPU Acceleration Fix for Chromium

## Problem
Chromium stutters when animating multiple `backdrop-blur` + `radial-gradient` cards via Framer Motion because they aren't promoted to compositor layers.

## Changes — `src/pages/CoachWaitlist.tsx`

### 1. Update `item` variant (line 77-80)
Add `willChange` hints to help Chromium promote layers during animation, then release after:
```ts
const item = {
  hidden: { opacity: 0, y: 24, willChange: "transform, opacity" },
  show: { opacity: 1, y: 0, willChange: "auto", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
```
- Shorter `y` offset (24 vs 30) and snappier cubic-bezier for less paint work
- `willChange: "auto"` on show state releases the layer hint after animation completes

### 2. Add GPU classes to both Bento Grid card `motion.div` elements
Append `transform-gpu will-change-transform backface-hidden [transform:translateZ(0)]` to both Phase 1 and Phase 2 card classNames. This forces Chromium to composite these elements on the GPU.

### 3. No visual changes
Identical layout, colors, spacing, and hover effects. Only rendering pipeline is affected.

