

## Fix Body Fat Calculation — Official US Navy Formula

### Problem
The current simplified formula (`86.010 * log10(waist-neck) - 70.041 * log10(height) + 36.76`) is not the standard US Navy formula and produces negative/incorrect results for many input combinations.

### Plan

**Single file change: `src/hooks/useBodyMeasurements.ts` lines 32-39**

Replace `calcNavyBodyFat` with the official metric US Navy formula:

```ts
export function calcNavyBodyFat(waist: number, neck: number, height = 175): number | null {
  if (waist <= 0 || neck <= 0 || height <= 0) return null;
  const diff = waist - neck;
  if (diff <= 0) return null;
  
  const denominator = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height);
  if (denominator <= 0) return null;
  
  const bf = 495 / denominator - 450;
  if (!isFinite(bf) || isNaN(bf)) return null;
  
  // Safety floor (2%) and ceiling (60%)
  const clamped = Math.max(bf, 2);
  if (clamped > 60) return null;
  
  return Math.round(clamped * 10) / 10;
}
```

**Key changes:**
- Standard formula: `BF% = 495 / (1.0324 - 0.19077 × log10(waist-neck) + 0.15456 × log10(height)) - 450`
- Guards against division by zero (denominator ≤ 0)
- Guards against `NaN`/`Infinity` from `Math.log10`
- Safety floor at 2% BF (physiological minimum)
- Ceiling at 60% (unrealistic above this)

No other files need changes — `calcNavyBodyFat` is already consumed correctly everywhere.

