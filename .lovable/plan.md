

## Plan: Wire Weekly Recap to Real Data (Part 4 of 10)

### Summary
Replace the hardcoded mock data in `useWeeklyRecap` with real database queries that aggregate the athlete's last 7 days of workouts, streak, tonnage, XP/coins, and challenges. The modal UI stays intact -- only the data source changes.

---

### Technical Details

#### 1. Rewrite `src/hooks/useWeeklyRecap.ts`

Replace the entire mock hook with a real aggregation engine:

- **Keep** the `showRecap` / `dismissRecap` state management pattern.
- **`triggerRecap()`** now performs real async queries before setting `recapData`:

  - **Workouts Completed**: Query `assigned_workouts` where `athlete_id = auth.uid()`, `status = 'completed'`, and `scheduled_date` falls within the last 7 days. Count the results.
  
  - **Streak**: Read directly from `profile.streak` (already available via `useAuth()`).
  
  - **Total Tonnage**: Parse the `exercises` JSONB column from completed workouts. Each exercise entry contains sets with `weight` and `reps`. Sum `weight * reps` across all sets of all exercises of all completed workouts in the period. If the JSONB structure doesn't contain logged weights, fallback to `0`.
  
  - **Challenges Won/Lost**: Query `challenges` table where `(challenger_id = uid OR opponent_id = uid)`, `status = 'completed'`, and `created_at` within last 7 days. Count wins (`winner_id = uid`) and losses.
  
  - **Bio-Coins Earned**: Query `bio_coin_transactions` where `user_id = uid`, `type = 'earn'` (or positive amounts), and `created_at` within last 7 days. Sum amounts.
  
  - **Compared to Last Week**: Run the same workout count and tonnage queries for days 8-14 ago. Calculate percentage difference: `((thisWeek - lastWeek) / lastWeek) * 100`. Handle division by zero gracefully.
  
  - **Week Date Range**: Calculate `weekStartDate` (7 days ago) and `weekEndDate` (today) as ISO strings.
  
  - **Top Exercise**: From completed workout exercises JSONB, count exercise name occurrences. Return the most frequent.
  
  - **Personal Records**: For now, hardcode `0` (PR tracking requires a dedicated system not yet built). Can be wired later.

- Return the same interface: `{ showRecap, recapData, triggerRecap, dismissRecap }`.

#### 2. No Changes to `WeeklyRecapModal.tsx`

The modal already consumes `WeeklyRecapData` interface cleanly. As long as the hook returns data matching this interface, the UI renders correctly with real values. No purging needed -- the modal has zero hardcoded data of its own.

#### 3. No Changes to `Kokpit.tsx`

The dashboard already wires `useWeeklyRecap()` and passes `recapData` to `WeeklyRecapModal`. The test button (Calendar icon) triggers `triggerRecap()` which will now perform real queries.

---

### Files Changed

| File | Action |
|------|--------|
| `src/hooks/useWeeklyRecap.ts` | Rewrite (real DB queries replacing mock data) |

No migration needed. All required tables (`assigned_workouts`, `challenges`, `bio_coin_transactions`, `profiles`) already exist with proper RLS.

