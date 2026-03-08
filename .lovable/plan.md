

# Digital Twin & Body Measurements System

## Overview
Create a `useBodyMeasurements` hook, an `UpdateMeasurementsModal`, and wire real Supabase data into the Profile page and 3D avatar labels. Fix RESTRICTIVE RLS on `body_measurements`.

## 1. Database Migration -- Fix RLS
All `body_measurements` policies are RESTRICTIVE (same bug as `weight_logs`). Drop and recreate as PERMISSIVE.

```sql
DROP POLICY IF EXISTS "Users manage own measurements" ON public.body_measurements;
CREATE POLICY "Users manage own measurements"
  ON public.body_measurements FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view athlete measurements" ON public.body_measurements;
CREATE POLICY "Coaches can view athlete measurements"
  ON public.body_measurements FOR SELECT TO authenticated
  USING (is_coach_of(user_id));
```

## 2. New: `src/hooks/useBodyMeasurements.ts`
- Fetch latest measurement: `body_measurements` ordered by `logged_at` desc, limit 1
- Fetch history (last 20 rows for trends)
- `saveMeasurement(data)`: INSERT with `user_id` from `useAuth().user.id`, all numeric fields cast with `Number()`
- Navy Seal BF% formula (male): `86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76` (default height 175cm)
- Auto-calculate `body_fat_pct` if waist and neck are provided but body_fat_pct is not
- Realtime subscription via `supabase.channel('body_measurements')` filtered by user_id, refetch on INSERT
- Full error logging with `JSON.stringify(error)`

## 3. New: `src/components/UpdateMeasurementsModal.tsx`
- Dialog with labeled number inputs: Boyun, Göğüs, Omuz, Bel, Kalça, Kol, Bacak, Yağ %, Kas (kg)
- Pre-fill with latest measurement values if they exist
- Navy formula preview: if waist and neck are filled but body_fat left empty, show calculated estimate
- On save: call `saveMeasurement()`, toast success/error, close modal
- Glass-card dark theme styling consistent with app

## 4. Edit: `src/pages/Profil.tsx`
- Import `useBodyMeasurements` and `UpdateMeasurementsModal`
- Add `showMeasurements` state for modal toggle
- Replace hardcoded `bodyStats` entries:
  - "Yağ Oranı" → `latest?.body_fat_pct ? \`%${latest.body_fat_pct}\` : "—"`
  - "Kas Kütlesi" → `latest?.muscle_mass_kg ? \`${latest.muscle_mass_kg} kg\` : "—"`
- Pass `measurements` prop to `RealisticBodyAvatar` (neck, chest, waist, arm, thigh, shoulder, hips)
- Add "Ölçümleri Güncelle" button in VÜCUT VERİLERİ section header
- Derive `waistScale` from real waist data when available (e.g., `waist / 85` normalized), fallback to timeline slider

## 5. Edit: `src/components/RealisticBodyAvatar.tsx`
- Accept optional `measurements` prop: `{ neck?: number; chest?: number; waist?: number; shoulder?: number; arm?: number; thigh?: number; hips?: number }`
- Render absolute-positioned HTML overlay labels around the 3D canvas:
  - Shoulder label: top-right area → "Omuz: Xcm"
  - Chest label: right-center → "Göğüs: Xcm"
  - Waist label: right-mid → "Bel: Xcm"
  - Arm label: far-left → "Kol: Xcm"
  - Thigh label: bottom-left → "Bacak: Xcm"
- Glass-morphism chip style: `backdrop-blur-md bg-white/10 border border-white/20 text-[10px] px-2 py-0.5 rounded-full`
- Only render labels that have non-null values

## File Summary

| File | Action |
|---|---|
| Migration SQL | Fix RLS on `body_measurements` |
| `src/hooks/useBodyMeasurements.ts` | Create -- fetch, save, realtime, Navy formula |
| `src/components/UpdateMeasurementsModal.tsx` | Create -- measurement input dialog |
| `src/pages/Profil.tsx` | Edit -- wire real data, add update button |
| `src/components/RealisticBodyAvatar.tsx` | Edit -- add measurement label overlays |

