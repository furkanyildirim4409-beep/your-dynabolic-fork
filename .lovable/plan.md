

# Fix: Full-Screen Camera Feed on iOS & Android

## Problem
The `html5-qrcode` library injects an intermediate wrapper `<div>` with inline styles that cap the video at ~50% viewport height. Current CSS selectors (`[&_div]`) target too broadly and miss the critical immediate-child wrapper that needs explicit height forcing.

## Changes (1 file)

### `src/components/BarcodeCameraScanner.tsx`

**Change 1 — Scanner container className (line 180)**

Replace:
```
className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center [&_div]:!border-none [&_div]:!shadow-none [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_canvas]:!hidden"
```

With:
```
className="absolute inset-0 z-0 bg-black overflow-hidden flex flex-col [&>div]:!h-[100dvh] [&>div]:!w-full [&>div]:!border-none [&>div]:!shadow-none [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!hidden"
```

Key differences:
- `[&>div]:!h-[100dvh]` — forces the library's immediate wrapper to span full dynamic viewport height (critical for iOS Safari address bar show/hide)
- `[&>div]:!w-full` — ensures wrapper spans full width
- `[&_video]:!absolute [&_video]:!inset-0` — pulls video out of flow and pins it to all 4 corners of the full-height wrapper
- `flex flex-col` instead of `flex items-center justify-center` — prevents centering from constraining the wrapper height

**Change 2 — Html5Qrcode constructor (line 63)**

Add `disableFlip: true` to prevent the library from injecting extra UI elements:
```typescript
const scanner = new Html5Qrcode(containerIdRef.current, {
  formatsToSupport: [...],
  verbose: false,
  disableFlip: true,
});
```

No other files affected.

