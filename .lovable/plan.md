

## Plan: Discover Page Part 4 — Comment Counts, Story Keyboard Fix, DM Activation

### Step A — Comment Counts on Feed

Add a small `<CommentCountBadge postId={post.id} />` component (inline, in `Kesfet.tsx`) that uses the existing `usePostCommentsCount` hook and renders the number next to `MessageCircle`. Reuse it in:
- `src/pages/Kesfet.tsx` (line ~371)
- `src/pages/CoachProfile.tsx` (line ~381)
- `src/pages/PostDetail.tsx` (line ~215)

Render: `<MessageCircle className="w-5 h-5" /><span className="text-xs">{count ?? 0}</span>` — matches the existing likes_count styling. While loading, show `0` (no skeleton flicker since the value is small).

### Step B — Story Viewer Keyboard Fix

Refactor reply container in `src/components/StoryViewer.tsx`:
1. Change wrapper from `absolute bottom-6` → `fixed left-0 right-0 px-4 z-30` with dynamic `bottom` driven by `visualViewport`.
2. Add a `useEffect` that subscribes to `window.visualViewport` `resize` + `scroll` events:
   ```ts
   const vv = window.visualViewport;
   const update = () => {
     const offset = window.innerHeight - vv.height - vv.offsetTop;
     setKeyboardOffset(Math.max(offset, 0));
   };
   vv.addEventListener("resize", update);
   vv.addEventListener("scroll", update);
   ```
3. Apply `style={{ bottom: \`calc(${keyboardOffset}px + env(safe-area-inset-bottom) + 1.5rem)\` }}`.
4. On focus, `inputRef.current?.scrollIntoView({ block: "end" })` after a short delay so iOS doesn't crop it.
5. Also change the parent `motion.div` from `touch-none` to allow keyboard interaction (already handled — input has `touch-auto`).

Fallback for browsers without `visualViewport`: keep current `bottom-6 + safe-area-inset-bottom`.

### Step C — Activate "Mesaj Gönder"

The app uses a single coach-chat (`useRealtimeChat` resolves coach via `profiles.coach_id`) opened via the `openCoachChat` window event in Kokpit. There is **no multi-conversation `chats` table**. Behavior:

In `CoachProfile.tsx` rewrite `handleMessage`:
1. Fetch current user's `profiles.coach_id`.
2. **If `coach_id === viewedCoachId`** (this is their assigned coach):
   - `navigate("/kokpit")` then `setTimeout(() => window.dispatchEvent(new CustomEvent("openCoachChat")), 150)` — exact pattern already used in `EliteDock.tsx` line 64.
3. **Else** (viewing a coach who isn't theirs):
   - `toast.info("Bu koçla mesajlaşmak için önce paketini satın al veya takip et.")` — keeps UX honest without inventing a non-existent multi-chat schema.

No DB migration. No new table. No silent failures.

### Optional follow-up flagged (not in this PR)
A true multi-coach DM system would require a new `direct_chats(participant_a, participant_b)` + `direct_messages` schema. Out of scope per the user's "use existing messaging architecture" note.

### Files to change
| File | Change |
|------|--------|
| `src/pages/Kesfet.tsx` | Inline `CommentCountBadge` next to MessageCircle |
| `src/pages/CoachProfile.tsx` | Same badge + rewrite `handleMessage` |
| `src/pages/PostDetail.tsx` | Same badge |
| `src/components/StoryViewer.tsx` | `visualViewport` listener + dynamic bottom offset |

