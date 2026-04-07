

# Edge-to-Edge Native UI Overhaul

## Problem
1. **Dialog padding bug**: Centered dialogs have unnecessary `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]` causing ugly gaps
2. **White gap under notch**: The `bg-background` doesn't bleed into the safe area on full-screen overlays — there's a visible uncolored strip behind the Dynamic Island
3. **Leaderboard squished**: The header content collides with the notch because it lacks proper safe-area handling

## Architecture

The correct approach: **background color bleeds edge-to-edge, content is inset.**

- Root `html, body, #root` get `background-color: hsl(var(--background))` so the notch area is always dark
- Centered dialogs: NO safe-area padding (they float in the middle)
- Full-screen overlays: background fills `inset-0`, inner header gets `pt-[env(safe-area-inset-top)]`
- Bottom bars: inner content gets `pb-[env(safe-area-inset-bottom)]`

## Changes

### 1. `src/index.css` — Root background bleed
Add to `@layer base`:
```css
html, body, #root {
  background-color: hsl(var(--background));
  min-height: 100vh;
  min-height: -webkit-fill-available;
}
```

### 2. `src/components/ui/dialog.tsx` — Revert safe-area padding
- **Remove** `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` from `DialogContent`
- **Reset** close button to standard `top-4 right-4`

### 3. `src/components/ui/sheet.tsx` — Smarter safe-area
- Keep `safe-top safe-bottom` for `left`/`right` (full-height) sheets — these are correct
- For `bottom` sheets: only `safe-bottom`, no `safe-top`
- Current blanket `safe-top safe-bottom` on all variants is fine for left/right but the close button position is already good

### 4. `src/pages/Leaderboard.tsx` — Edge-to-edge fix
- The outer `div` already has `bg-background` ✓
- Add `safe-top` padding to the **header inner div** (the one with the back button), not the outer wrapper
- Add `safe-bottom` to the bottom bar's inner content div

### 5. Full-screen custom overlays — Apply pattern consistently
For each `fixed inset-0 bg-background` overlay, the background wrapper stays `inset-0` (bleeds into notch), and the **header/first-child** gets the safe-area top padding:

| File | Fix |
|------|-----|
| `src/pages/Tarifler.tsx` | Add `safe-top` to inner content header |
| `src/components/NutriScanner.tsx` | Add `safe-top` to header section |
| `src/components/chat/ChatInterface.tsx` | Verify header has safe-top (already done) |
| `src/components/BodyMetricsOnboarding.tsx` | Add `safe-top` to the fixed wrapper |

## File Summary

| File | Change |
|------|--------|
| `src/index.css` | Add `html, body, #root { background-color }` for notch bleed |
| `src/components/ui/dialog.tsx` | Remove safe-area padding, reset close button |
| `src/pages/Leaderboard.tsx` | Move safe-top to header inner div, safe-bottom on bottom bar |
| `src/pages/Tarifler.tsx` | Add safe-top to recipe detail header |
| `src/components/NutriScanner.tsx` | Add safe-top to header |
| `src/components/BodyMetricsOnboarding.tsx` | Add safe-top |

