

## Critical Fix: Push Notifications Broken — `web-push` Import Crash

### Root Cause
The edge function logs show a fatal crash every time `send-chat-push` is invoked:
```
TypeError: Object prototype may only be an Object or null: undefined
    at https://esm.sh/jws@4.0.1/es2022/jws.mjs
```

The `https://esm.sh/web-push@3.6.7` import is **incompatible with Deno edge runtime**. The `jws` dependency (used internally by web-push for VAPID signing) fails because esm.sh's Node polyfills break `util.inherits`. This is why **no push notifications work at all** — not from athlete, not from coach.

### Fix

**1. `supabase/functions/send-chat-push/index.ts`** — Switch import from `esm.sh` to `npm:` specifier:
```typescript
// BROKEN:  import("https://esm.sh/web-push@3.6.7")
// FIX:    import webpush from "npm:web-push@3.6.7"
```

Move the import to a top-level static import (more reliable in Deno) and use the `npm:` specifier which Deno natively supports. Also merge the best parts from both repos:
- Emoji title format: `💬 ${senderName}`
- Media type preview text
- `coachUrl` and `athleteUrl` routing data
- Expired endpoint cleanup
- Proper error responses

**2. Deploy** the fixed function to Supabase.

**3. Remove `deno.lock`** if present — stale lockfile can cause deploy failures with changed import specifiers.

### Why This Fixes Both Sides
Both the athlete app and coach panel share the same Supabase project (`fsbhbfltathfcpvcjfzt`). There is only ONE deployed `send-chat-push` function. Fixing it here fixes push notifications for both apps. The coach panel's `sw-push.js` reads `coachUrl` from the payload, and the athlete's `sw.js` reads `athleteUrl` — both are included in the payload.

### Files Changed
- `supabase/functions/send-chat-push/index.ts` — rewrite with `npm:web-push` import

