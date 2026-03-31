

# Nutrition Epic Part 2: Dynamic Grammage Engine — Enhancement

## Current State

The core grammage engine **already exists**: `ServingEditPopover` (line 383) provides editable gram input with ratio-based macro recalculation, live preview, and DB persistence via `updateFoodServing`. It's wired into both `CheckedPlannedFoodRow` and `ManualFoodRow`.

What's **missing** from the user's request:

1. **Deviation indicator** — no visual signal when serving differs from coach target
2. **Macro color change** — edited macros look identical to original ones

## Changes — Single file: `src/pages/Beslenme.tsx`

### 1. Add Deviation Indicator to `CheckedPlannedFoodRow` (lines 506-531)

When a consumed food has `target_serving` and its current `serving_size` differs:
- Show the serving text in **amber** (`text-amber-400`) instead of muted
- Append a small `±` badge next to the serving size (e.g., `120g ±`)
- Show the original coach target as strikethrough text below: `~~100g~~`

Detection logic: compare `parseGrams(food.serving_size)` vs `parseGrams((food as any).target_serving)`. If they differ and `target_serving` exists → deviation = true.

### 2. Add Deviation Indicator to `ManualFoodRow` (lines 534-576)

Same amber treatment when `target_serving` exists and differs from `serving_size`.

### 3. Amber macro text on deviation

In both row components, when deviation is detected, change the macro values' text from default colors to amber tints:
- Calories: `text-amber-400` instead of `text-foreground`
- P/K/F labels: `text-amber-400/80` instead of their default colors

### 4. MacroDashboard totals (already correct)

The `totals` prop comes from `useConsumedFoods().totals`, which already reflects the actual DB values (updated by `updateFoodServing`). No change needed — totals auto-update.

## Technical notes

- No new files, hooks, or dependencies
- All changes are purely presentational (the math engine and persistence already work)
- ~30 lines of JSX changes across two row components

