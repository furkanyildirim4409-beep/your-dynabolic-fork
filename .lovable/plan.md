

## Plan: Rebuild Background Push Notifications & Deep Linking

### Current State Analysis

After reviewing the codebase, the core push infrastructure is already in place but has gaps:

- **`sw.js`**: Already handles `push` and `notificationclick` with deep linking via `athleteUrl`. Working correctly.
- **`usePushNotifications.ts`**: Registers SW, subscribes to push, saves to `push_subscriptions`. Uses `VITE_VAPID_PUBLIC_KEY` from env.
- **`send-chat-push` edge function**: Sends push with `athleteUrl: /?openChat=true&coachId=...`. Working correctly.
- **Kokpit.tsx**: Already reads `?openChat=true` query param and opens chat. Working.

**The actual gap**: No in-app foreground notification when a message arrives while the app is open. Push notifications only fire when the app is backgrounded/closed. When the app is in the foreground, the SW suppresses the push and the user sees nothing.

### What to Build

**1. Update `sw.js` — Forward pushes to open clients (foreground relay)**

When a push arrives and the app window is already focused, post a message to the client instead of showing a system notification. This lets the app show a toast. If no client is focused, show the system notification as usual.

**2. Create `src/hooks/useForegroundPush.ts` — In-app toast for live messages**

Listen for `navigator.serviceWorker.onmessage` events forwarded from the SW. When received, show a Sonner toast with sender name, message preview, and a "Görüntüle" button that navigates to the chat. Also listen to Supabase realtime `messages` table as a fallback.

**3. Wire into `AppShell.tsx`**

Import and call `useForegroundPush()` so it activates on all protected pages.

### Files

- **Modify**: `public/sw.js` — add foreground client detection + message forwarding
- **Create**: `src/hooks/useForegroundPush.ts` — toast notifications for foreground messages  
- **Modify**: `src/components/AppShell.tsx` — wire the hook

### Technical Detail

```text
Push arrives
    │
    ├─ App focused? → postMessage to client → React shows toast
    │
    └─ App not focused? → showNotification() → click → deep link via athleteUrl
```

No database changes needed. No edge function changes needed — the existing `send-chat-push` payload already contains all required routing data.

