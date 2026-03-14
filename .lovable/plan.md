

## Plan: Nutrition Calendar Future Visibility & Granular Macro UI

### Changes

#### 1. `src/hooks/useNutritionCalendar.ts`

- Add `"scheduled"` to `DayStatus` type
- Expand `DayNutritionStats` interface: add `targetProtein`, `targetCarbs`, `targetFat`, `plannedFoods` (array of PlannedFood), and enrich `logs` to include full macros
- Remove the `if (dayStart > today) return;` guard on line 129
- For future days within program bounds: set `status = "scheduled"`, populate `plannedFoods` and target macros, consumed values stay 0
- For future days outside program: set `status = "no-plan"`
- Past/today logic unchanged

#### 2. `src/components/NutritionCalendar.tsx`

- Add `scheduled: "bg-blue-400"` to `STATUS_COLORS`
- Enable clicking future scheduled days (remove `disabled={isFutureDay || !stats}` → `disabled={!stats}`)
- Style future days with lighter text but still clickable
- Add `{ status: "scheduled", label: "Planlandı" }` to legend
- Show dot for scheduled days

#### 3. `src/components/NutritionDayDetailModal.tsx`

- Add `MacroBadges` helper component with color-coded P/C/F badges
- Add `"scheduled"` status badge (blue, "Planlandı")
- New section: **"Hedeflenen İçerik"** — lists `stats.plannedFoods` with food name, serving size, and `MacroBadges`
- Redesign **"Tüketilen Öğünler"** section to show full macros per log via `MacroBadges`
- Target macro summary row showing target P/C/F alongside calories
- Keep existing delta badges at top

### No database changes needed — all data already available via `allFoods` and `nutrition_logs`.

