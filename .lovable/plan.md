

# No-Blur Chromium Performance Fix

## Problem
`backdrop-blur-md` on 15 animated cards over a grid background causes heavy compositing in Chromium, killing scroll performance.

## Changes — `src/pages/CoachWaitlist.tsx`

Three identical edits on lines 319, 364, and 409:

**Before:** `bg-white/[0.02] backdrop-blur-md border border-white/[0.05]`
**After:** `bg-[#0a0a0a] border border-white/[0.06]`

- Removes `backdrop-blur-md` entirely (eliminates the expensive filter)
- Swaps translucent `bg-white/[0.02]` for opaque `bg-[#0a0a0a]` (solid dark panel, no compositing needed)
- Bumps border opacity slightly (`0.05` → `0.06`) to compensate for the lost blur halo
- All GPU classes, hover effects, radial gradient glow, and animations remain untouched

