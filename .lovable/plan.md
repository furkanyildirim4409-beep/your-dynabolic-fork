

# Biometric Twin Engine — Part 3: Framer Motion Morphing + Build Fix

## Problem
1. **Build errors**: The TS compiler reports `cssText` errors at specific line numbers that don't match the current file. This is a stale build artifact — but the real fix is to refactor the file anyway, which will clear the cache.
2. **Jarring transitions**: CSS `transition` on SVG `<g>` elements is unreliable across browsers. Framer Motion's `motion.g` provides spring-based, GPU-accelerated morphing.

## Changes

### `src/components/athlete-detail/ParametricBodySVG.tsx` — Full rewrite

**Imports**: Add `motion` from `framer-motion`.

**Spring config**: Define a shared transition object:
```typescript
const morphSpring = { type: "spring", stiffness: 300, damping: 30 };
```

**Convert all `<g>` groups** from static style transforms to Framer Motion animated transforms:

```tsx
// Before (CSS transition - unreliable on SVG)
<g id="torso" style={{ transformOrigin: "60px 94px", transform: `scaleX(${s.torso})`, transition: '...' }}>

// After (Framer Motion spring)
<motion.g id="torso" 
  animate={{ scaleX: s.torso * s.overall }} 
  transition={morphSpring}
  style={{ transformOrigin: "60px 94px" }}
>
```

Apply this pattern to all 7 body groups: neck, torso, waist, hips, left-arm, right-arm, left-leg, right-leg.

**Dynamic glow filter**: Add a second SVG `<filter>` (`bodyGlow`) with `feDropShadow` whose `stdDeviation` is driven by the `overall` scale — higher body fat = wider, softer glow. Apply it to the torso group.

**Head stays static** — no scaling needed (no head measurement exists).

### No other files change
The `biometricScaleEngine.ts` and `BiometricTwin.tsx` remain untouched.

## Files

| Action | File |
|--------|------|
| Rewrite | `src/components/athlete-detail/ParametricBodySVG.tsx` |

