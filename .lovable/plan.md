

## Plan: Edge Function Role Fix — Use `user_roles` Table (Epic 2.4)

### Problem
All three reminder queries use `profiles!inner(role)` to filter athletes, but roles live in the `user_roles` table, not `profiles.role`. This causes 0 matches.

### Approach
Replace the `profiles!inner(role, notification_preferences)` join + `.neq` filter with a 2-step pattern:
1. Fetch push subscriptions with only `profiles(notification_preferences)` (left join, no role)
2. Query `user_roles` table to get the set of athlete user IDs
3. Filter in JS: must be athlete + must not have opted out

### Changes — `supabase/functions/send-scheduled-reminders/index.ts`

**Helper function** — Add a reusable `getAthleteIds` helper at the bottom:
```typescript
async function getAthleteIds(supabaseAdmin, userIds: string[]): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("user_id", userIds)
    .eq("role", "athlete");
  return new Set((data || []).map((r: any) => r.user_id));
}
```

**1. Check-in block (lines 69-107):**
- Query `push_subscriptions` with `profiles(notification_preferences)` (no `!inner`, no role filter)
- Call `getAthleteIds` with unique user IDs
- Filter: must be in athleteIds set + checkin_reminders not false
- Rest of logic (checkin check, payload, send) stays identical

**2. Meal block (lines 113-150):**
- Same pattern: fetch subs → getAthleteIds → filter by athlete + meal_reminders
- Rest unchanged

**3. Workout block (lines 178-189):**
- Fetch subs with `profiles(notification_preferences)` + `.in("user_id", needReminder)` (no role filter)
- Call `getAthleteIds` on needReminder
- Filter: athlete + workout_reminders not false
- Rest unchanged

**4. Redeploy** the edge function.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-scheduled-reminders/index.ts` | Replace 3 role queries with `user_roles` lookup; add helper |

