

## Dynamic Grammage Override & Macro Recalculation (Epic 8 - Part 2/6)

### Summary

Athletes can edit the serving size of consumed foods (both checked planned foods and manually added foods). When changed, macros are recalculated proportionally and saved to the `consumed_foods` table using the `target_serving` and `consumed_serving` columns.

### Changes

**1. `src/hooks/useConsumedFoods.ts` — Add `updateFoodServing` mutation**

- New function: `updateFoodServing(id, newGrams, originalGrams, originalMacros)`
- Calculates `ratio = newGrams / originalGrams`
- Updates `consumed_foods` row: `calories`, `protein`, `carbs`, `fat`, `consumed_serving` (`"120g"`), and preserves `target_serving` (the coach-assigned original)
- Optimistically updates local `foods` state so UI refreshes instantly

**2. `src/pages/Beslenme.tsx` — Add edit UI to `CheckedPlannedFoodRow` and `ManualFoodRow`**

- Add a small pencil (`Pencil` icon) button next to each consumed food row
- On click, open a `Popover` with:
  - Current serving display (e.g., "Koç hedefi: 100g")
  - An `Input` field for the new gram amount
  - Live macro preview showing recalculated values
  - Save button
- When saved, call `updateFoodServing` from the hook
- Show toast confirmation
- Both `CheckedPlannedFoodRow` and `ManualFoodRow` get the edit capability

**3. Serving parsing utility (inline)**

- `parseGrams(str)`: extracts number from strings like `"100g"`, `"150 g"`, `"200ml"` → returns the number or `100` as fallback

**4. When checking a planned food (`checkPlannedFood`)**

- Also save `target_serving` = planned food's `serving_size` so we always know the coach's original amount for ratio calculation

### Data Flow

```text
Athlete taps pencil → Popover opens
  → Types "120" → Live preview: 449 kcal, 16.8g P, ...
  → Taps "Kaydet"
  → updateFoodServing() called
    → ratio = 120 / 100 = 1.2
    → new macros = original * 1.2
    → UPDATE consumed_foods SET calories=449, protein=16.8, ...
       consumed_serving='120g'
    → Optimistic state update
    → Toast: "Porsiyon güncellendi"
```

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useConsumedFoods.ts` | Add `updateFoodServing`, save `target_serving` on check |
| `src/pages/Beslenme.tsx` | Add edit popover to `CheckedPlannedFoodRow` and `ManualFoodRow`, pass handler through `ExpandableMealCard` |

