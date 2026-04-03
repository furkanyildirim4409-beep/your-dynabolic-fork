

# Fix: Revert Over-Aggressive CSS (Black Screen Scanner)

## Problem
`[&>div]:!bg-black` paints a solid black background over the library's internal wrapper div, hiding the video element. `[&_video]:!absolute` also breaks the library's layout flow.

## Fix (1 file)

### `src/components/BarcodeCameraScanner.tsx` — Line 146

Replace the current `className` with:

```tsx
className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center [&_div]:!border-none [&_div]:!shadow-none [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_canvas]:!hidden"
```

**What changed:**
- Removed `[&>div]:!bg-black` — was painting over the video
- Removed `[&_video]:!absolute [&_video]:!top-0 [&_video]:!left-0` — was breaking library's DOM flow
- Removed `[&>div]:!h-full [&>div]:!w-full` — unnecessary with flex centering
- Added `flex items-center justify-center` — centers the video naturally
- Added `[&_div]:!shadow-none` — removes any library shadow artifacts
- Kept `bg-black` on the parent container only (safe)
- Kept `[&_video]:!object-cover` for mobile full-screen fill

Single line change, no other files affected.

