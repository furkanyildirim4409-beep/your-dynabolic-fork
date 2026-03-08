

# Connect Nutrition Tracking to Supabase

## Overview
`Beslenme.tsx` uses local state with hardcoded mock meals. We need to persist meals to the `nutrition_logs` table and fetch today's logs on load. The inline `MacroDashboard` already computes totals from the `meals` array, so we just need to sync that array with Supabase.

## Changes

### 1. Create `src/hooks/useNutritionLogs.ts`
A custom hook that:
- Fetches today's `nutrition_logs` for the current user (filter `logged_at` to today using `gte` / `lt` on ISO date boundaries)
- Returns `logs`, `isLoading`, and a `refetch` function
- Parses each log's `foods` JSONB into the app's `FoodItem[]` format
- Provides a `logMeal` async function that inserts a row into `nutrition_logs` with `user_id`, `meal_name`, `foods`, `total_calories`, `total_protein`, `total_carbs`, `total_fat`

### 2. Update `src/pages/Beslenme.tsx`
- Import `useAuth` and the new `useNutritionLogs` hook
- On mount, fetch today's logs and map them into the existing `meals` state structure (merge with the 4 meal slots: Kahvaltı, Öğle, Ara Öğün, Akşam)
- In `handleConfirmAddFood`: after updating local state, call `logMeal()` to insert into Supabase, then show `toast.success("Öğün başarıyla kaydedildi!")`
- In `handleRemoveFood`: keep local-only for now (no delete RLS), but recalculate totals
- Show skeleton placeholders while `isLoading`

### 3. Update `src/components/NutritionHistory.tsx`
- Import `useAuth` and `supabase`
- Fetch last 7 days of `nutrition_logs` grouped by date (using `gte` on 7 days ago)
- Aggregate calories/protein/carbs/fat per day from real data
- Replace the hardcoded `last7Days` array
- Keep skeleton loader for loading state, empty state if no history

### 4. No migration needed
The `nutrition_logs` table already exists with correct columns and RLS policies (users can manage own logs, coaches can view).

## File Summary

| File | Change |
|---|---|
| `src/hooks/useNutritionLogs.ts` | New hook: fetch today's logs, insert meals |
| `src/pages/Beslenme.tsx` | Use hook, persist meals on add, loading state |
| `src/components/NutritionHistory.tsx` | Fetch real 7-day history from Supabase |

