

## Rest Day Enforcement via `assigned_diet_days` (Epic 8 - Part 1 Fix)

### Problem

Both `useDietPlan.ts` and `useNutritionCalendar.ts` use blind modulo arithmetic (`(elapsed % totalTemplateDays) + 1`) to determine which template day maps to each calendar date. This means every single day within the program duration gets a diet plan — there are no rest days. The coach panel now writes explicit `assigned_diet_days` rows only for days with food, so the athlete app must respect that.

### Solution

Query `assigned_diet_days` for the athlete and use it as the authoritative day-number lookup. If no row exists for a date, that day is a rest day with zero targets and no planned foods.

### Changes

**1. `src/hooks/useDietPlan.ts` — Use `assigned_diet_days` for today's plan**

- Fetch from `assigned_diet_days` where `athlete_id = user.id` and `target_date = today` (single row query)
- If a row exists, use its `day_number` to filter `allFoods`
- If no row exists (rest day), set `plannedFoods = []` and `dynamicTargets = null`
- Remove the modulo-based `currentDayNumber` calculation from `temporalState`
- Keep `totalTemplateDays` for display purposes (cycle badge)

**2. `src/hooks/useNutritionCalendar.ts` — Use `assigned_diet_days` for the month**

- Fetch all `assigned_diet_days` rows for the athlete within the current month range
- Build a `Map<string, number>` mapping `target_date → day_number`
- In the `dayStatsMap` computation, look up each date in this map instead of using modulo arithmetic
- If no entry exists for a date within the program range, treat it as a rest day (`status: "empty"`, zero targets)
- Future dates with an assignment get `status: "scheduled"`, future dates without get `status: "no-plan"`

**3. UI — Rest day indication (minimal)**

- In `Beslenme.tsx`, when `plannedFoods` is empty and `hasTemplate` is true and the diet is active, show a subtle "Dinlenme Günü" (Rest Day) badge instead of the meal cards
- The calendar already handles empty days via the `"empty"` status dot

### Files Changed

| File | Action |
|------|--------|
| `src/hooks/useDietPlan.ts` | Query `assigned_diet_days` for today, replace modulo logic |
| `src/hooks/useNutritionCalendar.ts` | Query `assigned_diet_days` for month, replace modulo logic |
| `src/pages/Beslenme.tsx` | Add rest day badge when active template has no foods for today |

