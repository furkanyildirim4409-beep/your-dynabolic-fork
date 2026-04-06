

# Biometric Twin Engine — Part 2: The Conversion Algorithm

## Summary
Create a scale engine that converts real cm/% measurements into SVG transform multipliers, then apply them to the parametric body groups so the silhouette visually morphs as the slider moves.

## New File: `src/utils/biometricScaleEngine.ts`

**Baselines** (average athletic male):
```
neck: 38, chest: 100, shoulder: 115, waist: 80, hips: 95, arm: 35, thigh: 55, body_fat_pct: 15
```

**Function**: `calculateScales(measurements: BodyMeasurement | null)` returns:
```typescript
interface BodyScales {
  neck: number;    // scaleX for neck group
  torso: number;   // scaleX for torso (driven by chest + shoulder avg)
  waist: number;   // scaleX for waist ellipse
  hips: number;    // scaleX for hips ellipse
  arm: number;     // scaleX for arm paths
  leg: number;     // scaleX for leg paths
  overall: number; // subtle uniform scale from body_fat_pct influence
}
```

**Logic per region:**
- `scale = measurement / baseline` (e.g., 100cm waist / 80cm baseline = 1.25)
- Clamp each to `[0.8, 1.4]`
- Body fat influence: `overall = 1 + (bf% - 15) * 0.005`, clamped `[0.95, 1.1]` — adds subtle width to everything at high BF%
- If measurement is null/0, return `1.0` (no deformation)

## Edit: `src/components/athlete-detail/ParametricBodySVG.tsx`

- Import `calculateScales`
- Call `const scales = useMemo(() => calculateScales(measurements), [measurements])`
- Apply transforms to each `<g>` group:
  - `<g id="neck">`: `transform: scaleX(scales.neck * scales.overall)`
  - `<g id="torso">`: `transform: scaleX(scales.torso * scales.overall)`
  - `<g id="waist">`: `transform: scaleX(scales.waist * scales.overall)`
  - `<g id="hips">`: `transform: scaleX(scales.hips * scales.overall)`
  - `<g id="left-arm">` / `<g id="right-arm">`: `transform: scaleX(scales.arm)`
  - `<g id="left-leg">` / `<g id="right-leg">`: `transform: scaleX(scales.leg)`
- Add CSS `transition: transform 0.4s ease` on each group for smooth morphing when slider moves
- `transform-origin` is already set on each group — no changes needed there

## Files

| Action | File |
|--------|------|
| Create | `src/utils/biometricScaleEngine.ts` |
| Edit   | `src/components/athlete-detail/ParametricBodySVG.tsx` |

