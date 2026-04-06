

# Holographic Heatmap HUD — Pivot Plan

## Problem
The current detailed muscle-line SVG paths look amateurish. We're pivoting to a "holographic heatmap scan" aesthetic: a single clean silhouette used as a clip mask, with blurred glowing orbs inside that react to measurement scales.

## Approach

### Complete rewrite of `ParametricBodySVG.tsx`

**1. Clean Silhouette as Clip Path**
- Define ONE smooth, closed `<path>` representing a full human body outline (head, shoulders, arms, torso, legs, feet) using polished bezier curves
- Register as `<clipPath id="body-clip">` in `<defs>`
- Render outline stroke separately at `stroke={P}` opacity 0.4

**2. Heatmap Orbs (clipped inside the body)**
- 7 `<motion.ellipse>` elements inside `<g clipPath="url(#body-clip)">`:
  - Chest (cx=70, cy=75) → `s.torso`
  - Waist (cx=70, cy=122) → `s.waist`
  - Hips (cx=70, cy=150) → `s.hips`
  - Left Arm (cx=30, cy=90) → `s.arm`
  - Right Arm (cx=110, cy=90) → `s.arm`
  - Left Leg (cx=52, cy=220) → `s.leg`
  - Right Leg (cx=88, cy=220) → `s.leg`
- Heavy Gaussian blur (`stdDeviation="14"`), `fill={P}`
- Framer Motion `animate` binds `scaleX`, `scaleY`, `opacity` to scale values
- Larger measurement → orb expands and glows brighter

**3. Animated Scan Line**
- Horizontal `<line>` with CSS `@keyframes` sweeping top-to-bottom (~4s infinite loop)
- Clipped to body silhouette, primary color at low opacity + blur

**4. Background Grid + Center Axis**
- Keep existing grid pattern, center dashed axis, and top scanlines overlay

**5. Preserved Contract**
- Same props, imports, `viewBox="0 0 140 300"`, `h-[380px]`
- No changes to `biometricScaleEngine.ts` or `BiometricTwin.tsx`

## Technical Detail

### File changes

| Action | File |
|--------|------|
| Rewrite | `src/components/athlete-detail/ParametricBodySVG.tsx` |

The component keeps the same interface and `calculateScales` integration. All motion groups are replaced by the clip-mask + orbs architecture. A `<style>` block inside the SVG defines the scan-line keyframe animation.

