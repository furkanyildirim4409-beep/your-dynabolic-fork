

# Connect Water Tracking to Supabase

## Overview
Replace the local `waterIntake` state in `Beslenme.tsx` with real data from the `water_logs` table. No schema changes needed -- table and RLS policies already exist.

## Changes

### 1. Create `src/hooks/useWaterTracking.ts`
- Fetch today's `water_logs` for current user (filter `logged_at` with `gte`/`lt` on today's date boundaries)
- Sum `amount_ml` to get total
- `addWater(amountMl: number)`: INSERT a row, refetch
- `removeLatestWater()`: SELECT most recent today's log, DELETE it, refetch
- Return `{ totalMl, addWater, removeLatestWater, isLoading }`

### 2. Update `src/pages/Beslenme.tsx`
- Import and use `useWaterTracking` hook
- Remove `const [waterIntake, setWaterIntake] = useState(2.0)`
- Derive `waterIntake` as `totalMl / 1000` (convert ml to L for UI)
- Wire `+` button to `addWater(250)` (250ml per glass)
- Add a `-` button wired to `removeLatestWater()`
- Show toast on add/remove
- Keep existing progress bar and visual indicators as-is (they already work with the L-based value)

### File Summary

| File | Change |
|---|---|
| `src/hooks/useWaterTracking.ts` | New hook: fetch, add, remove water logs |
| `src/pages/Beslenme.tsx` | Replace local state with hook, add remove button |

