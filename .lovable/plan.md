

## Plan: Digestion Slider + Editable Check-in + Edit Logging

### Current State
- `daily_checkins` table already has a `digestion` integer column
- The `DailyCheckIn` component currently blocks re-entry after submission ("Bugünkü check-in tamamlandı")
- No edit logging infrastructure exists

### Changes

**1. Database: Create `checkin_edit_logs` table** (migration)
```sql
CREATE TABLE public.checkin_edit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL,
  user_id uuid NOT NULL,
  previous_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkin_edit_logs ENABLE ROW LEVEL SECURITY;
-- RLS: users manage own, coaches can view athlete logs
```

**2. Update `DailyCheckInType`** (`src/types/shared-models.ts`)
- Add `digestion: number` field

**3. Rewrite `DailyCheckIn.tsx` logic**
- Add "SİNDİRİM" slider (green gradient, `Apple`/utensils icon) to `sliderConfigs`
- Add `digestion` to state values (default 3)
- When `hasSubmittedToday` is true: instead of a dead-end screen, **load existing values** into the sliders and show an "GÜNCELLE" (Update) button
- On update: `UPDATE` the existing `daily_checkins` row + `INSERT` into `checkin_edit_logs` with old vs new values
- On first submit: `INSERT` as before, now including `digestion`
- Include `digestion` in readiness calculation (minor weight)

**4. Coach infrastructure**
- `checkin_edit_logs` has coach-readable RLS via `is_coach_of(user_id)`
- Coaches can see full edit history per athlete per day

### Files
- **Migration**: Create `checkin_edit_logs` table with RLS
- **Modify**: `src/types/shared-models.ts` (add digestion field)
- **Modify**: `src/components/DailyCheckIn.tsx` (add digestion slider, edit mode, edit logging)

