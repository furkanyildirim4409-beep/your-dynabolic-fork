

## Plan: Meal-Based Grouping in Nutrition Day Modal

### Single file change: `src/components/NutritionDayDetailModal.tsx`

1. Add `useMemo` import and meal constants (`MEAL_LABELS`, `MEAL_ORDER`) at top
2. Inside the component, group `plannedFoods` by `meal_type` using `useMemo`, sorted by meal order
3. Replace the flat planned foods list (lines 112-127) with nested rendering: meal header → foods under it, with a left border accent for visual hierarchy

No other files need changes — `plannedFoods` already carries `meal_type` from the `PlannedFood` type.

