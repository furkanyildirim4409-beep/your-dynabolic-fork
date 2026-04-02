

# Fix: Barcode Scanner Mobile Viewport Letterboxing

## Problem
On mobile (portrait), the `html5-qrcode` library forces its native landscape aspect ratio, causing ~50% black bars. The library's internal `<div>` and `<video>` elements use inline styles that override standard CSS.

## Fix (1 file)

### `src/components/BarcodeCameraScanner.tsx` — Line 146

Replace the scanner container's `className` with deep CSS overrides using `!important` via Tailwind's `!` prefix to defeat the library's inline styles:

```tsx
className="absolute inset-0 z-0 overflow-hidden [&>div]:!h-full [&>div]:!w-full [&>div]:!border-none [&>div]:!bg-black [&_video]:!absolute [&_video]:!top-0 [&_video]:!left-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!hidden"
```

**Why each rule matters:**
- `[&>div]:!h-full [&>div]:!w-full` — forces the library's wrapper div to fill the container instead of respecting the camera's native aspect ratio
- `[&_video]:!object-cover` — crops the landscape feed to fill the portrait screen (no stretching, no black bars)
- `[&_video]:!absolute + inset rules` — tears the video out of flow so it covers the full container
- `[&_canvas]:!hidden` — hides the library's internal scanning canvas overlay
- `[&>div]:!border-none` — removes the library's default border styling

Single line change. No other files affected.

