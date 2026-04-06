

# Elite Realism SVG Engine — Part 1: Silhouette & Palette Swap

## Overview
Replace the minimalist outline silhouette with a detailed anatomical muscle diagram rendered in the dark HUD / neon-lime palette, while preserving the existing `<motion.g>` hierarchy so all morphing animations continue working.

## File Changed

| Action | File |
|--------|------|
| Rewrite | `src/components/athlete-detail/ParametricBodySVG.tsx` |

## Technical Approach

### Preserved Structure
The component keeps its exact interface, imports, `calculateScales` usage, `morphSpring` config, and all 8 `<motion.g>` groups with identical `id` values and `animate`/`transition` props. Only the SVG paths *inside* each group change.

### New SVG Details (per motion group)

**Head** — Skull outline with jaw definition, ear lines, and a subtle cranial midline. Fill with faint primary glow.

**Neck** — Sternocleidomastoid lines (two diagonal strokes from jaw to clavicle), trapezius attachment curves.

**Torso** — The most complex group:
- Outer contour: Shoulder caps (deltoid curves), lat flare, oblique taper
- Pectorals: Two curved regions with pec-split line down center
- Abdominals: 6-pack grid — 3 horizontal lines + vertical linea alba
- Serratus: Diagonal finger-like strokes on the lateral ribcage
- All internal lines at 20-40% opacity primary color; outer contour at full primary

**Waist** — Oblique definition lines (diagonal strokes) replacing the simple ellipse, with the dashed measurement ring retained as overlay.

**Hips** — Iliac crest lines, hip flexor separation curves, inguinal crease lines.

**Arms (left + right)** — Each arm gets:
- Deltoid cap (rounded triangle)
- Bicep/tricep separation line running down the upper arm
- Forearm brachioradialis line
- Elbow joint circle marker

**Legs (left + right)** — Each leg gets:
- Quadriceps: Vastus lateralis/medialis separation lines
- Knee joint circle marker
- Calf: Gastrocnemius split line
- Tibialis anterior line on the shin

### Palette Rules (applied globally)
- Outer contours: `stroke="hsl(var(--primary))"` at `strokeWidth="0.8"`
- Internal muscle lines: `stroke="hsl(var(--primary) / 0.25)"` at `strokeWidth="0.4"`
- Deep detail lines (ab grid, serratus): `stroke="hsl(var(--primary) / 0.15)"` at `strokeWidth="0.3"`
- Muscle region fills: `fill="hsl(var(--primary) / 0.03)"` for subtle volume
- Joint markers: small circles with `fill="hsl(var(--primary) / 0.2)"`

### Enhanced Filters & Overlays
- Existing `bodyGlow` filter stays on the torso group (dynamic glow based on body fat)
- Add a new `muscleGlow` filter (tight `stdDeviation=0.8` blur) applied to internal muscle detail lines for a subtle "hologram scan" effect
- Existing grid and scanline patterns remain as the base and top layers
- Add a secondary finer scanline pattern (`2px` spacing) overlaid on the torso region only

### ViewBox & Sizing
- Expand viewBox from `0 0 120 280` to `0 0 140 300` to accommodate wider shoulder/deltoid detail and foot definition
- Increase CSS height from `h-[340px]` to `h-[380px]`
- All `transformOrigin` values on motion groups adjusted proportionally for the new coordinate space

### No Other Files Change
`biometricScaleEngine.ts`, `BiometricTwin.tsx`, and all badge/connector logic remain untouched. The motion group IDs and scale bindings are identical.

