

## iOS PWA Push Notification Fix

### Root Cause

**iOS WebKit requires every `push` event to call `showNotification()`.** The current `sw-push.js` skips `showNotification()` when the app is in the foreground (lines 20-27), instead relaying via `postMessage`. On Android/Desktop this works fine, but on iOS WebKit, failing to show a notification causes the push to be silently swallowed and can lead to push permission revocation.

### Secondary Issues
1. `vibrate` is not supported on iOS and should be omitted
2. The runtime error "Rendered more hooks than during the previous render" is likely a stale HMR artifact but should be investigated

### Fix

**File: `public/sw-push.js`**

Change the `push` event handler to **always** call `showNotification()`, while still relaying to the foreground via `postMessage` as a bonus (for in-app toast deduplication). The key change:

```
// ALWAYS show notification (iOS requirement)
// ADDITIONALLY relay to foreground client for in-app toast
```

- Remove `vibrate` (unsupported on iOS)
- Always call `self.registration.showNotification()` regardless of foreground state
- Still postMessage to foreground client so the in-app toast can show (and the user sees it inline too)

**File: `src/hooks/useForegroundPush.ts`**

No changes needed -- the deduplication via `seenIds` already handles the case where both a system notification AND an in-app toast could fire.

### Files to modify
- `public/sw-push.js` -- Always show notification + remove vibrate

