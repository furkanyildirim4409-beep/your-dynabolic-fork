

## Plan: Edge Function Hotfix — Role Filtering for Scheduled Reminders

### Problem
The `send-scheduled-reminders` edge function sends check-in nudges to ALL users with push subscriptions, including coaches. Only athletes should receive these reminders.

### Changes

#### `supabase/functions/send-scheduled-reminders/index.ts`

**1. Check-in nudge query (line 68-70)** — Add `profiles!inner(role)` join filtered to athletes only:
```typescript
const { data: allSubs } = await supabaseAdmin
  .from("push_subscriptions")
  .select("endpoint, p256dh, auth, user_id, profiles!inner(role)")
  .eq("profiles.role", "athlete");
```

**2. Workout reminder subscription query (line 126-129)** — Same defensive filter:
```typescript
const { data: subs } = await supabaseAdmin
  .from("push_subscriptions")
  .select("endpoint, p256dh, auth, user_id, profiles!inner(role)")
  .eq("profiles.role", "athlete")
  .in("user_id", needReminder);
```

**Note**: The `push_subscriptions` table has a `user_id` column that references `profiles(id)`, so the `profiles!inner()` join will work via the existing foreign key relationship. The `profiles!inner` join ensures only rows with a matching profile are returned, and the `.eq` filter restricts to athletes.

After code update, deploy the edge function.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-scheduled-reminders/index.ts` | Add `profiles!inner(role)` athlete filter to both subscription queries |

