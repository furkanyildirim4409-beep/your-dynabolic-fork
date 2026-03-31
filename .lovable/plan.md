

# Nutrition Epic Part 1: Water Tracker Fix & Compact Adherence

## 1. Fix Water Tracker Rounding (`src/components/WaterTrackerWidget.tsx`)

**Problem**: Line 97 uses `.toFixed(1)` which rounds `3.75` → `3.8`.

**Fix**: Change the display logic to show 2 decimal places when the value isn't a clean multiple, or more precisely — always divide ml by 1000 and use a smart formatter:

- Line 97: Replace `{(totalMl / 1000).toFixed(1)}L` with a formatter that uses `.toFixed(2)` but trims trailing zeros after the first decimal (e.g. `4.00` → `4.0`, `3.75` → `3.75`, `1.50` → `1.5`).
- Implementation: inline expression `{(totalMl / 1000).toFixed(2).replace(/0$/, '')}L`
- Line 100: Same fix for the goal display (currently fine at `2.5` but apply consistency).
- Line 31 toast: Fix the toast in `handleAdd` — change `.toFixed(1)` to same formatter.

## 2. Compact Weekly Adherence (`src/pages/Beslenme.tsx`)

**Current state** (lines 1011-1049): The adherence widget is already a horizontal card with a ring + text + 7 mini bars. It's actually fairly compact but sits between the MacroDashboard and the Tabs.

**Improvement**: Merge the adherence strip *into* the MacroDashboard card to eliminate an entire card's vertical footprint. Specifically:

- Remove the standalone adherence block (lines 1011-1049).
- Add a slim adherence row at the bottom of the `MacroDashboard` component (lines 78-150), shown only when `weeklyAdherence` data is passed as an optional prop.
- The row: a single `flex items-center gap-2` line with the percentage badge, "Haftalık Uyum" label, adherent/total text, and the 7 mini bars — all in one tight `py-2 border-t border-white/5` strip inside the existing card.

### Files to edit

| File | Change |
|---|---|
| `src/components/WaterTrackerWidget.tsx` | Fix `.toFixed(1)` → smart 2-decimal formatter (lines 97, 100, 31) |
| `src/pages/Beslenme.tsx` | Remove standalone adherence widget (lines 1011-1049); pass `weeklyAdherence` to `MacroDashboard`; add compact adherence row inside `MacroDashboard` |

