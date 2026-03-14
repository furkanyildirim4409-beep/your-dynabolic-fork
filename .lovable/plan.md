

## Plan: Zero-Latency Nutrition Calendar (Caching & DB Indexing)

### 1. Module-Level Cache in `src/hooks/useNutritionCalendar.ts`

- Add a `globalLogsCache` Map outside the hook (survives Dialog unmounts)
- Implement SWR pattern in the `useEffect` (lines 57-93):
  - Build cache key from `user.id + yyyy-MM`
  - If cache hit: set logsMap immediately, skip loading state
  - Always fetch in background to revalidate, then update cache + state
- No other changes to the hook

### 2. Database Index Migration

- Create migration to add composite B-Tree index on `nutrition_logs(user_id, logged_at)` for fast date-range queries

### Files
- **Modified**: `src/hooks/useNutritionCalendar.ts` — add global cache map + SWR fetch logic
- **Created**: DB migration via migration tool — `CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs (user_id, logged_at)`

