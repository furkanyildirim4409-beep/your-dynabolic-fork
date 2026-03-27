

## Plan: Weekly Digest Payload Fix

**Single change in `supabase/functions/send-weekly-digest/index.ts`**

Update line ~131: change `data: { url: "/profil" }` to `data: { url: "/profil?showSummary=true" }` so push notifications deep-link directly to the weekly summary modal.

Then redeploy the edge function.

| File | Change |
|------|--------|
| `supabase/functions/send-weekly-digest/index.ts` | Update payload URL from `/profil` to `/profil?showSummary=true` |

