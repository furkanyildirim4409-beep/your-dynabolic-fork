

# Plan: Supplements Data Binding (Mock to Supabase)

## Summary
Replace hardcoded supplement mock data with a `useSupplements` hook that fetches from the existing `assigned_supplements` table, with graceful fallback to mock data. Zero visual changes.

## Current State
- `assigned_supplements` table exists in Supabase with columns: `id`, `athlete_id`, `coach_id`, `name_and_dosage`, `is_active`, `source_insight_id`, `created_at`
- RLS policies already configured (athletes see own, coaches manage)
- `Beslenme.tsx` imports mock data from `mockData.ts` and initializes local state
- `SupplementTracker.tsx` expects: `id`, `name`, `dosage`, `timing`, `servingsLeft`, `totalServings`, `takenToday`, `icon`

## Problem
The DB table only has `name_and_dosage` (a single text field). It lacks `timing`, `icon`, `servings_left`, `total_servings` columns needed for the tracker UI.

## Implementation

### Step 1: Migrate `assigned_supplements` table (add missing columns)

Add columns to support the tracker UI:
- `dosage` (text, nullable) -- e.g. "5g"
- `timing` (text, default "Sabah") -- e.g. "Antrenman Sonrası"
- `icon` (text, default "💊")
- `servings_left` (integer, default 30)
- `total_servings` (integer, default 30)

Keep `name_and_dosage` for backward compatibility but use a separate `dosage` column going forward.

### Step 2: Create `src/hooks/useSupplements.ts`

- Fetch from `assigned_supplements` where `athlete_id = auth.uid()` and `is_active = true`
- Parse `name_and_dosage` to extract name (split on first comma or use full string as name)
- Map DB rows to the `Supplement` interface
- Track `takenToday` in local state (client-side toggle, not persisted yet)
- Fallback to mock data if query fails or user not authenticated
- Expose: `supplements`, `isLoading`, `toggleTaken(id)`, `refillStock(id)`

### Step 3: Update `src/pages/Beslenme.tsx`

- Replace `import { assignedSupplements }` and local `useState<Supplement[]>` with `useSupplements()`
- Wire `handleToggleSupplement` and `handleRefillSupplement` to hook methods
- Add skeleton loading state in the supplements tab
- Add empty state when no supplements assigned

### Step 4: Add empty state + loading skeleton

- Loading: 3-4 skeleton cards matching card height
- Empty: centered icon + "Koçunuz henüz bir takviye programı atamadı." message in dark theme style

### Files Changed
1. **New migration** -- ALTER TABLE `assigned_supplements` ADD COLUMNS
2. **New file**: `src/hooks/useSupplements.ts`
3. **Modified**: `src/pages/Beslenme.tsx` (replace mock data with hook)
4. **No changes** to `SupplementTracker.tsx` (UI preserved exactly)

