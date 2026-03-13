

## iOS PWA Cache Busting & WebKit Deep Linking Fix

### 1. Aggressive SW Update on Boot (`src/hooks/usePushNotifications.ts`)
Add `navigator.serviceWorker.getRegistrations()` loop at the start of the auto-sync effect to force iOS to fetch the latest SW byte-for-byte on every app launch. This busts the stubborn WebKit SW cache.

### 2. WebKit-Safe `notificationclick` (`public/sw-push.js`)
Replace the current `notificationclick` handler (lines 42-63) with the WebKit-safe pattern: find the focused client (or default to first), call `focus()` BEFORE `navigate()`. iOS WebKit silently fails if you navigate without focusing first.

### 3. Race-Proof Deep Link Check (`src/pages/Kokpit.tsx`)
Add a secondary `window.location.search` check on mount (lines 70-76) as a fallback for when iOS boots the app from a fully closed state and `useSearchParams` hasn't hydrated yet. Also listen for the custom `openCoachChat` event (already in place at line 78-80).

### Files to modify
- `public/sw-push.js` — WebKit-safe notificationclick
- `src/hooks/usePushNotifications.ts` — Force SW update on boot
- `src/pages/Kokpit.tsx` — Race condition fallback

