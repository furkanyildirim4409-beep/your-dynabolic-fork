

## Application-Wide Mobile Responsiveness Hotfix

### Problem Analysis
Multiple full-screen overlays use `position: absolute` with fixed pixel offsets (e.g., `top-8`, `top-28`, `bottom-12`) and fixed-size elements (240px timer circle). On small mobile screens (~375px height when keyboard or notch is present), these elements overlap and stack incorrectly. The core issue is **not a missing media query** — the app is already constrained to 430px max-width. The problem is that overlay internals use absolute positioning instead of flex flow.

### Strategy
Convert overlay layouts from absolute-positioned elements to **natural flex-column flow with overflow-y-auto**, so content stacks cleanly regardless of viewport height. Scale down fixed-size elements on smaller screens using responsive classes.

---

### File Changes

**1. `src/components/ExerciseRestTimerOverlay.tsx`**
- Remove `absolute` positioning from header (`absolute top-8`), completed exercise (`absolute top-28`), and skip button (`absolute bottom-12`)
- Convert the root container from `flex items-center justify-center` to `flex flex-col` with `overflow-y-auto` and proper padding
- All children become natural flex items that stack vertically
- Scale the SVG timer from 240px to a responsive size: `w-48 h-48 sm:w-60 sm:h-60` (192px on mobile, 240px on larger)
- Skip button becomes a sticky-bottom element with `mt-auto` instead of `absolute bottom-12`
- Add `safe-area-inset` padding at bottom

**2. `src/components/RestTimerOverlay.tsx`**
- Same pattern: remove `absolute` from header and skip button
- Convert to flex-column flow with `overflow-y-auto`
- Header becomes a flex-shrink-0 top section
- Skip button uses `mt-auto` + bottom padding instead of `absolute bottom-8`
- Timer circle already uses responsive `w-64 h-64` — keep as is

**3. `src/components/VisionAIExecution.tsx`**
- **Workout Summary** (line 545): Change from `absolute inset-0 ... justify-center` to `absolute inset-0 ... overflow-y-auto` with `py-12` padding instead of `justify-center`. This ensures the summary scrolls on small screens when content (stats + analytics + overload cards) exceeds viewport
- **Info Panel** (line 789): The `h-[45%]` panel with `overflow-hidden` — change the inner content div to `overflow-y-auto` so completed sets log + notes + failure button don't get clipped
- **Exercise List Sheet** (line 997): Already uses `overflow-y-auto` — no change needed
- **Controls area**: Already uses `grid grid-cols-3` — works fine on mobile. Add `gap-1` on very small screens via responsive class

**4. `src/components/chat/ChatInterface.tsx`**
- The chat uses absolute positioning for header/messages/input which is actually correct for a chat layout. The fixed pixel offsets (`top-[72px]`, `bottom-[80px]`) are the issue
- Change header to use `flex-shrink-0` in a flex container instead of absolute
- Change the messages area from `absolute top-[72px] bottom-[80px]` to `flex-1 overflow-y-auto`
- Change input area from `absolute bottom-0` to `flex-shrink-0`
- This eliminates hardcoded pixel offsets and makes the layout resilient to safe-area insets

**5. `src/index.css` — Global utility additions**
- Add a `.safe-bottom` utility: `padding-bottom: env(safe-area-inset-bottom)`
- No global `!important` overrides — those would break intentional absolute positioning in modals

### Technical Notes

| Component | Current Issue | Fix |
|---|---|---|
| ExerciseRestTimerOverlay | 3 absolute children overlap on small screens | Flex-column flow, responsive timer size |
| RestTimerOverlay | Skip button overlaps controls on short viewports | Flex-column flow, mt-auto skip button |
| VisionAIExecution Summary | Non-scrollable, content clips | Add overflow-y-auto to summary |
| VisionAIExecution Info Panel | Completed sets log gets clipped | overflow-y-auto on inner content |
| ChatInterface | Hardcoded pixel offsets for regions | Flex-column layout, no absolute positioning |

### What This Does NOT Change
- EliteDock (bottom nav) — already works fine with safe-area padding
- AppShell — already correctly structured with max-w-[430px]
- Modals (RPE info, heart rate info) — already use `fixed inset-0` with centered content and `max-w-xs`, which works on mobile

