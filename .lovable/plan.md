

# iOS Capacitor Safe Area & Viewport Fix

## Problem
In the Capacitor iOS build, content collides with the status bar/Dynamic Island at the top and the home indicator at the bottom. The webview also has a bouncy overscroll effect.

## Changes

### 1. `index.html` — Add `viewport-fit=cover`
Add `viewport-fit=cover` to the existing viewport meta tag so `env(safe-area-inset-*)` values become non-zero.

### 2. `src/index.css` — Native feel CSS
Add to the `body` rule:
- `overscroll-behavior-y: none` — kills iOS bounce
- `-webkit-user-select: none; user-select: none` — prevents text selection like native
- `padding-top: env(safe-area-inset-top)` on `html` or a wrapper to push content below notch

### 3. `src/components/AppShell.tsx` — Safe area top padding
Change `pt-6` to include the safe area inset at the top:
```
style={{ 
  paddingTop: 'calc(24px + env(safe-area-inset-top))',
  paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' 
}}
```

### 4. `src/components/EliteDock.tsx` — Already handled
The dock already uses `bottom: max(16px, env(safe-area-inset-bottom))` — no change needed.

### 5. `src/components/chat/ChatInterface.tsx` — Safe area on header & input
- Header: add `paddingTop: env(safe-area-inset-top)` so it clears the notch
- Bottom input bar already has `safe-area-inset` class but verify it works with `viewport-fit=cover`

## Files

| File | Change |
|------|--------|
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/index.css` | Add overscroll/selection overrides to body |
| `src/components/AppShell.tsx` | Add safe-area-inset-top to padding |
| `src/components/chat/ChatInterface.tsx` | Add safe-area-inset-top to header |

