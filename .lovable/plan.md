

## Data Integrity (Kcal) & History Filters (Phase 3 - Epic 7 - Part 5/5)

### Problem 1: Kcal Mismatch
The workout summary in `VisionAIExecution.tsx` (line 550-558) calculates calories using only `baseBurn + failCount * 15` — it **omits the mechanical bonus** (tonnage component). Meanwhile, `useWorkoutHistory.ts` (line 83-85) includes all three pillars: `baseBurn + failureSets * 15 + mechanicalBonus`. Since `workout_logs` has no `calories` column, both sides recalculate independently and produce different numbers.

**Solution**: Add a `calories_burned` column to `workout_logs` and save the calculated value at workout completion time. Both the summary and history then use the same persisted value.

### Problem 2: No Date Filter
The workout history list renders all entries without filtering.

---

### Changes

**1. Migration: Add `calories_burned` column to `workout_logs`**
```sql
ALTER TABLE public.workout_logs ADD COLUMN calories_burned integer;
```

**2. `src/lib/workout.ts` (NEW) — Shared calorie calculator**
```typescript
export const calculateWorkoutCalories = (
  durationMinutes: number,
  weightKg: number,
  tonnageKg: number,
  failureSets: number
): number => {
  const baseBurn = (durationMinutes / 60) * weightKg * 5.0;
  const mechanicalBonus = (tonnageKg / 1000) * 20;
  return Math.round(baseBurn + failureSets * 15 + mechanicalBonus);
};
```

**3. `src/components/VisionAIExecution.tsx`**
- Import `calculateWorkoutCalories`
- In the workout summary display (line 550): use the shared function with tonnage included
- In `handleCompleteWorkout` (line 401): save `calories_burned` to the DB insert

**4. `src/hooks/useWorkoutHistory.ts`**
- Import `calculateWorkoutCalories`
- Prefer `log.calories_burned` from DB when available; fall back to recalculation for legacy entries
- Replace inline calorie math with the shared function

**5. `src/hooks/useWeeklyWorkoutStats.ts`**
- Import and use `calculateWorkoutCalories` for consistency

**6. `src/pages/Antrenman.tsx` — Date Filter**
- Add `dateFilter` state: `"all" | "this-month" | "last-month" | "this-year"`
- Add a `Select` dropdown between the history header and the stats summary
- Filter `workoutHistory` array by `logged_at` before rendering
- Options: Tüm Zamanlar, Bu Ay, Geçen Ay, Bu Yıl

### Files Changed
| File | Action |
|------|--------|
| Migration | Add `calories_burned` column to `workout_logs` |
| `src/lib/workout.ts` | NEW — shared `calculateWorkoutCalories` |
| `src/components/VisionAIExecution.tsx` | Use shared calc, save to DB |
| `src/hooks/useWorkoutHistory.ts` | Read DB value, fallback to shared calc |
| `src/hooks/useWeeklyWorkoutStats.ts` | Use shared calc |
| `src/pages/Antrenman.tsx` | Add date filter Select to history overlay |

