

## Smart Macro Targets Implementation

### Summary
Add goal-based calorie/macro auto-calculation to the measurements modal, persist to DB, and wire up across Beslenme and Profil pages. No database migration needed -- `daily_protein_target`, `daily_carb_target`, `daily_fat_target`, and `fitness_goal` columns already exist on `profiles`.

### Changes

**1. `src/components/UpdateMeasurementsModal.tsx`**
- Add `fitnessGoal` state (`maintenance` | `cut` | `bulk`) initialized from `profile?.fitness_goal`
- Add a "Hedef" Select field in the Profile Fields section with 3 options: Kilo Ver (Cut), Kas Yap (Bulk), Koruma (Maintenance)
- Show a live TDEE preview with goal adjustment in the estimates section (TDEE -500 / +300 / +0)
- In `handleSave`: calculate targets using the formulas below, include `fitness_goal`, `daily_protein_target`, `daily_carb_target`, `daily_fat_target` in the profile update, then call `refreshProfile()`

```text
Goal calorie offsets:
  cut:         TDEE - 500
  bulk:        TDEE + 300
  maintenance: TDEE

Macro split (using current weight):
  Protein: 2.0g × weightKg  →  P_cal = protein × 4
  Fat:     0.8g × weightKg  →  F_cal = fat × 9
  Carbs:   (targetCal - P_cal - F_cal) / 4
```

**2. `src/pages/Beslenme.tsx`**
- Import `useAuth` (already imported) and read `profile?.daily_protein_target`, `daily_carb_target`, `daily_fat_target`
- Replace the hardcoded `macroGoals` constant with dynamic values from profile, falling back to current defaults (180/250/70/2200)
- Pass goals into `MacroDashboard` as a prop or compute inside it

**3. `src/pages/Profil.tsx`**
- Add a "Günlük Hedef" card after the VÜCUT VERİLERİ section showing:
  - Target Calories (with goal label: Kilo Ver/Kas Yap/Koruma)
  - Protein / Carbs / Fat targets in grams
- Read values from `profile?.daily_protein_target` etc.
- Show "Henüz ayarlanmadı" state when targets are null

**4. `src/hooks/useBodyMeasurements.ts`**
- Add and export `calcMacroTargets(weightKg, tdee, goal)` utility returning `{ calories, protein, carbs, fat }`

### File count: 4 files modified, 0 migrations

