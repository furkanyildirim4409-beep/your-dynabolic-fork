

## Automate Muscle Mass (LBM) Calculation

### Problem
`calcMuscleMass` currently multiplies lean mass by 0.47 (skeletal muscle estimate), but the user wants **full Lean Body Mass (LBM)** — `weight * (1 - BF%/100)`. The "Tahmini Kas" card also lacks an explanatory tooltip.

### Changes

**1. `src/hooks/useBodyMeasurements.ts` — Fix formula**
- Change `calcMuscleMass` to return full LBM: `weightKg * (1 - bodyFatPct / 100)`
- Remove the `* 0.47` multiplier
- Keep existing guards (weight > 0, BF > 0 and < 100)
- Auto-persist logic in `saveMeasurement` already works correctly — no changes needed there

**2. `src/pages/Profil.tsx` — Add info tooltip to "Tahmini Kas" card**
- Import `Info` icon from lucide-react
- Add a Tooltip around the "TAHMİNİ KAS" label in the Timeline section (line ~229) explaining: *"Yağsız Vücut Kütlesi (LBM) baz alınarak hesaplanmıştır"*
- Also add a similar tooltip to the "Kas Kütlesi" stat in the body stats grid (line ~55)

### Formula Change
```text
BEFORE: leanMass * 0.47  (skeletal muscle subset)
AFTER:  weight * (1 - BF%/100)  (full LBM)
```

Example: 85kg, 18% BF → Before: 32.7kg → After: 69.7kg

No database or migration changes needed — the column `muscle_mass_kg` already stores the value.

