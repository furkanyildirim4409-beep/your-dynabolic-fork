

# Connect Weight Tracking to Supabase

## Overview
The weight logging UI lives in `QuickActionFAB.tsx` (modal with kg input + save button). Currently it just shows a toast with no persistence. The `Profil.tsx` page shows hardcoded body stats including "Kilo: 78.5 kg". We need to wire both to the `weight_logs` table and `profiles.current_weight`.

## Changes

### 1. Create `src/hooks/useWeightTracking.ts`
- Fetch weight history from `weight_logs` ordered by `logged_at` ascending (last 30 entries)
- Provide `logWeight(weightKg: number)` that:
  - INSERTs into `weight_logs` with `user_id` and `weight_kg`
  - UPDATEs `profiles.current_weight` for the user
  - Calls `refreshProfile()` from AuthContext
  - Refetches weight history
- Return `{ weightHistory, latestWeight, logWeight, isLoading }`
- `latestWeight` derived from `profile?.current_weight` or last history entry

### 2. Update `src/components/QuickActionFAB.tsx`
- Import `useWeightTracking` and `useAuth`
- Initialize `weight` input from `profile?.current_weight ?? 78.5`
- In `handleSaveWeight`: call `logWeight(parseFloat(weight))`, show `toast.success("Kilo kaydı başarıyla eklendi!")` on success, handle errors
- Add loading state to save button

### 3. Update `src/pages/Profil.tsx`
- Import `useAuth` (already imported) and read `profile?.current_weight`
- Replace hardcoded `"78.5 kg"` in `bodyStats` with `profile?.current_weight ? \`${profile.current_weight} kg\` : "—"`

### 4. Update `src/components/BioMetricsDashboard.tsx` (optional enhancement)
- No weight tab exists here currently (it's biometric: RHR, HRV, Sleep, Steps). Weight is separate. No changes needed.

## File Summary

| File | Change |
|---|---|
| `src/hooks/useWeightTracking.ts` | New hook: fetch history, log weight, update profile |
| `src/components/QuickActionFAB.tsx` | Persist weight to Supabase on save |
| `src/pages/Profil.tsx` | Show real `current_weight` from profile |

