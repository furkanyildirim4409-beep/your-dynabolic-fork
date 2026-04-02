

# Fix: Barcode Scanner Full-Height Video Feed

## Problem
The camera feed only fills ~50% of the screen because the library's internal wrapper div isn't expanding to full height. The previous fix removed the div sizing rules (`[&>div]:!h-full`, `[&>div]:!w-full`) and video positioning (`[&_video]:!absolute`), which are actually necessary.

## Fix (1 file)

### `src/components/BarcodeCameraScanner.tsx` — Line 146

Replace the current `className` with:

```tsx
className="absolute inset-0 z-0 bg-black overflow-hidden [&>div]:!h-full [&>div]:!w-full [&>div]:!border-none [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!hidden"
```

**What changed vs current:**
- Re-added `[&>div]:!h-full [&>div]:!w-full` — forces the library's wrapper to fill the container (fixes the 50% height issue)
- Re-added `[&_video]:!absolute [&_video]:!inset-0` — pins video to all 4 corners of the container
- Removed `flex items-center justify-center` — unnecessary with absolute video positioning
- Removed `[&_div]:!shadow-none` — unnecessary
- Changed `[&_div]` selectors to `[&>div]` — targets only direct child (the library wrapper), not all descendant divs
- **No `[&>div]:!bg-black`** — the wrapper stays transparent so video remains visible

Single line change, no other files affected.

