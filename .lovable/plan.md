

## Plan: Universal Media Chat Engine (Part 3 of 4)

### Current State

- **`messages` table**: Already has `media_url` and `media_type` columns.
- **`ChatInterface.tsx`**: Already renders image/audio media in bubbles. Missing: file attachment input UI, video rendering.
- **`challenge_messages` table**: No `media_url` or `media_type` columns.
- **`useChallengeChat.ts`**: `sendMessage` only accepts a plain string. No file upload logic.
- **`ChallengeDetailModal.tsx`**: Chat tab has plain text input only, no media rendering in bubbles.
- **`chat-media` bucket**: Already exists and is public.
- **`useRealtimeChat.ts`**: `sendMessage` only accepts a string. No file upload logic.

### Changes

#### 1. Migration — Add media columns to `challenge_messages`

```sql
ALTER TABLE public.challenge_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.challenge_messages ADD COLUMN IF NOT EXISTS media_type TEXT;
```

No bucket creation needed (`chat-media` exists).

#### 2. `src/hooks/useChallengeChat.ts` — Media-aware send

- Change `sendMessage` signature to accept `{ text: string; file?: File }`.
- If file provided: enforce 20MB limit, sanitize filename, upload to `chat-media/${challengeId}/...`, get public URL, determine `media_type` from `file.type`.
- Insert into `challenge_messages` with `media_url` and `media_type`.
- Update `ChatMessage` interface to include `media_url?` and `media_type?`, map them in the query.

#### 3. `src/components/ChallengeDetailModal.tsx` — Rich Duel Chat

- Add state: `chatFile` (File | null), `chatFileInputRef`.
- Chat input area: add Paperclip/Camera button that triggers hidden file input. Show file preview thumbnail above input when file selected (with X to clear).
- `handleSendMessage`: pass `{ text: message, file: chatFile }` to `sendMessage`.
- Message bubbles: render `msg.media_url` as `<img>` or `<video>` above text based on `media_type`.

#### 4. `src/hooks/useRealtimeChat.ts` — Media-aware send for Coach Chat

- Change `sendMessage` to accept `{ content: string; file?: File }`.
- If file provided: same 20MB limit, sanitize, upload to `chat-media/coach/...`, get URL, determine type.
- Insert with `media_url` and `media_type`. Update optimistic message accordingly.

#### 5. `src/components/chat/ChatInterface.tsx` — Rich Coach Chat Input

- Add state: `chatFile`, `chatFileInputRef`.
- Add Paperclip button next to input. Show preview strip above input when file attached.
- Add video rendering in bubbles (currently only image and audio).
- `handleSend`: pass file alongside content.

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/..._challenge_chat_media.sql` | Add `media_url`, `media_type` to `challenge_messages` |
| `src/hooks/useChallengeChat.ts` | Media upload in sendMessage, updated types/query |
| `src/components/ChallengeDetailModal.tsx` | Rich chat input + media bubbles |
| `src/hooks/useRealtimeChat.ts` | Media upload in sendMessage |
| `src/components/chat/ChatInterface.tsx` | Attachment button, file preview, video bubbles |

