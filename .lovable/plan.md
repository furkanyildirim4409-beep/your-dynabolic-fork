

# Fix Safe Area Insets for All Modals, Sheets & Portals

## Problem
Portal-based UI (Dialogs, Sheets, Drawers) and custom `fixed inset-0` overlays render outside AppShell, so they don't inherit safe-area padding. Content collides with the iOS notch/Dynamic Island and home indicator.

## Approach

### A. Global CSS utility classes (index.css)
Add reusable safe-area utility classes that all overlays can reference:
```css
.safe-top { padding-top: env(safe-area-inset-top) }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom) }
```

### B. Core UI primitives (3 files)

**1. `src/components/ui/dialog.tsx`**
- `DialogContent`: add `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` to the base classes
- Close button: shift down with `top-[max(calc(env(safe-area-inset-top)+1rem),1rem)]`

**2. `src/components/ui/sheet.tsx`**
- `SheetContent`: add safe-area padding based on `side`:
  - `top` / full-height (`left`, `right`): add top + bottom safe insets
  - `bottom`: add bottom safe inset only
- Close button: same top shift as Dialog

**3. `src/components/ui/drawer.tsx`**
- `DrawerContent` (bottom-anchored): add `pb-[env(safe-area-inset-bottom)]`
- `DrawerFooter`: add bottom safe inset

### C. Custom full-screen overlays (biggest impact files)

These use `fixed inset-0` directly, bypassing Shadcn primitives:

| File | Fix |
|------|-----|
| `src/components/VisionAIExecution.tsx` | Add `safe-top` class to the root `fixed inset-0` div; its header/close button will clear the notch |
| `src/components/RestTimerOverlay.tsx` | Add `safe-top safe-bottom` to the full-screen container |
| `src/components/ChallengeDetailModal.tsx` | Add safe insets to the `fixed inset-0` wrapper |
| `src/components/BarcodeCameraScanner.tsx` | Add `safe-top` to the camera overlay header |
| `src/components/CoachBloodworkModal.tsx` | Add `safe-top` to the full-screen overlay |
| `src/pages/Akademi.tsx` | Add `safe-top` to both course-detail and module overlays |
| `src/components/WeeklyRecapModal.tsx` | Add `safe-bottom` to the recap overlay content |
| `src/components/ExerciseRestTimerOverlay.tsx` | Add safe insets to its full-screen container |

### D. Files NOT changed
- `AppShell.tsx` — already fixed
- `EliteDock.tsx` — already uses `env(safe-area-inset-bottom)`
- `ChatInterface.tsx` — already fixed

## File Summary

| File | Change |
|------|--------|
| `src/index.css` | Add `.safe-top` / `.safe-bottom` utility classes |
| `src/components/ui/dialog.tsx` | Safe insets on content + close button |
| `src/components/ui/sheet.tsx` | Safe insets per side variant + close button |
| `src/components/ui/drawer.tsx` | Bottom safe inset on content + footer |
| `src/components/VisionAIExecution.tsx` | Add safe-top to root overlay |
| `src/components/RestTimerOverlay.tsx` | Add safe-top + safe-bottom |
| `src/components/ChallengeDetailModal.tsx` | Add safe insets |
| `src/components/BarcodeCameraScanner.tsx` | Add safe-top |
| `src/components/CoachBloodworkModal.tsx` | Add safe-top |
| `src/pages/Akademi.tsx` | Add safe-top to overlays |
| `src/components/WeeklyRecapModal.tsx` | Add safe-bottom |
| `src/components/ExerciseRestTimerOverlay.tsx` | Add safe insets |

