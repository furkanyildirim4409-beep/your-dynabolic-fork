

## Water Tracker Overhaul & Backend Wiring (Phase 2 - Epic 3)

### Current State
- **Beslenme page**: Already has a water widget inline (lines 975-1033) wired to `useWaterTracking` — functional but basic (+/- buttons, simple progress bar)
- **Kokpit page**: Uses `useWaterTracking` for display only via `QuickStatsRow`
- **QuickActionFAB**: Water button uses LOCAL state (`waterCount`) — completely disconnected from backend
- **Hook exports**: `{ totalMl, addWater, removeLatestWater, isLoading }`

### Plan

**1. Create `src/components/WaterTrackerWidget.tsx` — Standalone Premium Widget**

A self-contained glassmorphic card component that can be dropped into any page.

- Wire to `useWaterTracking()` hook for real backend data
- Circular SVG ring progress indicator with liquid gradient (`from-blue-600 to-cyan-400`)
- Center display: `{(totalMl/1000).toFixed(1)}L / 2.5L` with 💧 emoji
- Three quick-add buttons below the ring: `+250ml 🥛`, `+500ml 🚰`, `+1L 💧`
- Undo button (calls `removeLatestWater`)
- All buttons wrapped in `motion.button` with `whileTap={{ scale: 0.95 }}`
- Toast feedback on add/remove
- Skeleton loader while `isLoading`
- Card styling: `bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 relative overflow-hidden`
- Decorative background glow: `absolute bg-blue-500/10 blur-3xl`

**2. Replace Beslenme inline water section**

- Remove the inline water tracker block (lines ~970-1033) from `Beslenme.tsx`
- Import and render `<WaterTrackerWidget />` in its place
- Remove now-unused water-related state/imports from that section

**3. Fix QuickActionFAB backend wiring**

- Import `useWaterTracking` in `QuickActionFAB.tsx`
- Replace the local `waterCount` state with `addWater(250)` from the hook
- Show `totalMl` in the toast instead of the fake local counter

**4. No database changes needed**

The `water_logs` table and hook already exist and work correctly.

### Technical Notes
- The circular SVG ring uses `stroke-dasharray` / `stroke-dashoffset` for the fill animation
- Daily goal hardcoded to 2500ml (matching existing `2.5L` references); can be made configurable later
- The widget is stateless aside from the hook — no local water state duplication

