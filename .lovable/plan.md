

## Plan: Edge Function Precision Patch — `.neq("coach")` Fix

### Problem
Three queries in `send-scheduled-reminders` use `.eq("profiles.role", "athlete")` which excludes users with `role = null` or `role = 'user'`. The select already includes `notification_preferences` (added in previous edit), so only the filter needs changing.

### Changes

#### `supabase/functions/send-scheduled-reminders/index.ts`

**1. Check-in query (line 72)** — change `.eq` to `.neq`:
```
.eq("profiles.role", "athlete")  →  .neq("profiles.role", "coach")
```

**2. Meal query (line 116)** — same fix:
```
.eq("profiles.role", "athlete")  →  .neq("profiles.role", "coach")
```

**3. Workout query (line 181)** — same fix:
```
.eq("profiles.role", "athlete")  →  .neq("profiles.role", "coach")
```

Three single-line changes, then redeploy.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-scheduled-reminders/index.ts` | Change 3x `.eq("profiles.role", "athlete")` → `.neq("profiles.role", "coach")` |

