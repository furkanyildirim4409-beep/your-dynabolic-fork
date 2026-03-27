

## Plan: Edge Function Role Fix — Use `user_roles` Table (Epic 2.4) ✅ COMPLETED

### Problem
All three reminder queries used `profiles!inner(role)` to filter athletes, but roles live in the `user_roles` table, not `profiles.role`. This caused 0 matches.

### Solution Applied
- Added `getAthleteIds()` helper that queries `user_roles` table for `role = 'athlete'`
- All 3 blocks (check-in, meal, workout) now use 2-step pattern: fetch subs → verify athlete role via `user_roles` → filter preferences in JS
- Removed `!inner` join and `.neq` SQL filter from all queries
- Deployed edge function
