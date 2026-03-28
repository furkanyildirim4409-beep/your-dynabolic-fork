

## Critical iOS PWA Viewport Hotfix (dvh & safe-area)

### Root Cause
iOS Safari in PWA standalone mode miscalculates `100vh` — it includes the status bar and home indicator in the measurement, causing `fixed inset-0` containers to extend beyond the visible area. This breaks all flex layouts, `mt-auto` positioning, and causes overlapping elements. The `100dvh` (Dynamic Viewport Height) unit correctly represents the actual visible area.

### Changes

**1. `index.html` — Add `viewport-fit=cover`**
Add `viewport-fit=cover` to the viewport meta tag so `env(safe-area-inset-*)` values are populated on iOS:
```
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**2. `src/index.css` — Lock body, enable dvh**
Replace the current `body` styles in `@layer base` with:
```css
html, body {
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  position: fixed;
  top: 0; left: 0;
}

#root {
  height: 100dvh;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```
Keep existing `bg-background`, `text-foreground`, `font-sans`, `antialiased` on body.

**3. `src/components/AppShell.tsx`**
- Change outer `min-h-screen` → `min-h-[100dvh]`
- Change inner `min-h-screen` → `min-h-[100dvh]`
- Change `motion.main` `min-h-screen` → `min-h-[100dvh]`

**4. Overlay containers — add `h-[100dvh]`**
For each overlay using `fixed inset-0`, add explicit `h-[100dvh] overflow-hidden` on the root, with `overflow-y-auto` on the inner scrollable child:

| File | Line | Current | Change |
|------|------|---------|--------|
| `ExerciseRestTimerOverlay.tsx` | 104 | `fixed inset-0 z-50 ... flex flex-col items-center overflow-y-auto` | Add `h-[100dvh]` |
| `RestTimerOverlay.tsx` | 63 | `fixed inset-0 z-50 ... flex flex-col items-center overflow-y-auto` | Add `h-[100dvh]` |
| `ChatInterface.tsx` | 80 | `fixed inset-0 z-50 bg-background flex flex-col` | Add `h-[100dvh]` |
| `VisionAIExecution.tsx` | 529 | `fixed inset-0 z-50 ... flex flex-col overflow-hidden` | Add `h-[100dvh]` |
| `BodyScanUpload.tsx` | 110 | `fixed inset-0 z-50 ... flex flex-col` | Add `h-[100dvh]` |
| `Akademi.tsx` | 199 | `fixed inset-0 z-50 ... flex flex-col` | Add `h-[100dvh]` |
| `SplashScreen.tsx` | 14 | `fixed inset-0 z-[9999] ... flex flex-col` | Add `h-[100dvh]` |
| `ChallengeDetailModal.tsx` | 179 | Already has `h-[100dvh]` | No change needed |

### What This Achieves
- `position: fixed` on body prevents iOS rubber-band bounce that shifts the viewport
- `100dvh` gives the true visible height on iOS PWA, so flex containers calculate correctly
- `overflow-y-auto` on `#root` re-enables scrolling for page content inside the locked viewport
- All overlays are explicitly bounded to the dynamic viewport height

