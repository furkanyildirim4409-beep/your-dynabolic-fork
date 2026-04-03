

# Fix: Barcode Scanner Black Screen — Direct Video Targeting

## Problem
The `[&>div]:!h-[100dvh]` override on the library's wrapper divs breaks the internal DOM flow, collapsing the video layer and causing a black screen. The fix is to stop manipulating wrapper divs' dimensions and instead target the `<video>` element directly.

## Change (1 file, 1 line)

### `src/components/BarcodeCameraScanner.tsx` — Line 180

Replace current className:
```
"absolute inset-0 z-0 bg-black overflow-hidden flex flex-col [&>div]:!h-[100dvh] [&>div]:!w-full [&>div]:!border-none [&>div]:!shadow-none [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!hidden"
```

With:
```
"absolute inset-0 z-0 bg-black overflow-hidden [&_div]:!bg-transparent [&_div]:!border-none [&_video]:!absolute [&_video]:!top-0 [&_video]:!left-0 [&_video]:!w-full [&_video]:!h-[100dvh] [&_video]:!max-w-none [&_video]:!object-cover [&_canvas]:!hidden"
```

**What changed:**
- Removed all `[&>div]` height/width forcing — this was collapsing the library's DOM
- Removed `flex flex-col` — unnecessary, was constraining layout
- Added `[&_div]:!bg-transparent` — prevents any library wrapper from painting over the video
- Changed video positioning to explicit `!top-0 !left-0` instead of `!inset-0`
- Set video height to `!h-[100dvh]` directly on the video element (not on wrapper divs)
- Added `!max-w-none` to prevent any max-width constraint on the video

