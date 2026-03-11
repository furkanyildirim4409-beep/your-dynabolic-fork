

## Overwrite `send-chat-push` Edge Function with Ultimate Version

### Problem
The current deployed version lacks `media_type` handling, uses `npm:` import (can cause issues), doesn't clean up expired push endpoints, and has a generic fallback name ("Eğitmen" instead of "Sistem").

### Changes

**`supabase/functions/send-chat-push/index.ts`** — Full overwrite with these improvements:

1. **Media type preview** — Extracts `media_type` from the message record; shows "📷 Fotoğraf gönderdi" for images, "🎤 Ses kaydı gönderdi" for audio instead of raw content
2. **VAPID key validation** — Checks keys exist before attempting to use them, throws descriptive error if missing
3. **esm.sh import for web-push** — Switches from `npm:web-push@3.6.7` to `https://esm.sh/web-push@3.6.7` with default import for better Deno compatibility
4. **Expired endpoint cleanup** — After sending, deletes any push subscriptions that returned HTTP 410 (Gone)
5. **Response includes `cleaned` count** — Reports how many stale subscriptions were removed
6. **Better error handling** — Uses `err.message` instead of `String(err)`
7. **Payload preserved** — Keeps the correct `url: "/"`, `coachUrl`, `athleteUrl`, `senderId` routing data

### Deploy
Automatically deploy the function to Supabase after the file write.

