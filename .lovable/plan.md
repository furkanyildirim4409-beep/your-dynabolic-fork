

## PWA Layout Shift & Vision AI Safe Area Fix

### Problem
1. In iOS PWA standalone mode, the app shifts up creating a black void at the bottom, and the Vision AI close button gets cut off by the notch/Dynamic Island.
2. The Vision AI screen uses fixed percentage heights (`h-[55%]` / `h-[45%]`) without accounting for safe areas.

### Changes

**1. `src/components/VisionAIExecution.tsx`**

- **Root container** (line 472): Add safe area padding to the `fixed inset-0` container so content respects notch and home indicator:
  ```
  className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden touch-none"
  style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
  ```

- **Header close button** (line 606): Add top safe-area offset so the X button sits below the notch/Dynamic Island. Change the header div to use a calculated top padding:
  ```
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
  ```

- **Vision area** (line 662): Change from fixed `h-[55%]` to `flex-1` so it takes remaining space dynamically instead of a rigid percentage.

- **Info panel** (line 754): Change from fixed `h-[45%]` to a flexible height that adapts. Use `flex-shrink-0` with `max-h-[45%]` or keep the current structure but let the vision area flex.

- **Image container** (line 674-691): Update the image wrapper to use `rounded-3xl` with better flex centering and the image to use `opacity-90 transition-opacity duration-500`.

**2. `src/index.css`** — No changes needed (already has safe area padding on body and `100dvh` support).

**3. `index.html`** — Already has `viewport-fit=cover`. No change needed.

**4. `src/components/AppShell.tsx`** — Already uses `min-h-[100dvh]`. No change needed.

### Summary
- 1 file edited: `VisionAIExecution.tsx`
- Safe area insets added to Vision AI fullscreen overlay
- Fixed percentage heights replaced with flexbox for dynamic adaptation
- Close button repositioned below notch/Dynamic Island

