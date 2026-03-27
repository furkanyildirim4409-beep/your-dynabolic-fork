

## iOS Push Deep Link Fix — Plan

### Problem

The current `notificationclick` handler reads the URL from `event.notification.data.athleteUrl`, but the backend sends it as `event.notification.data.url`. This key mismatch means the URL always falls back to `/`, so iOS (and likely all platforms) never deep-links correctly from push taps.

Additionally, the current approach relies solely on `postMessage` to tell React Router to navigate. On iOS PWA, when the app is suspended/frozen, `postMessage` is unreliable — the client may not be listening yet. The fix is a dual strategy: use `client.navigate()` as the primary mechanism (which iOS WebKit respects), with `postMessage` as a fallback for Radix UI cleanup.

### Changes

**File 1: `public/sw-push.js`** — Rewrite `notificationclick` handler

- Fix the data key: read from `event.notification.data?.url` (matching backend payload), with `athleteUrl` as legacy fallback
- Use `client.navigate(targetUrl)` as the **primary** navigation method (iOS requires this)
- Send `postMessage` **after** navigate as a secondary signal for Radix UI body-lock cleanup
- Add exact-URL match check to avoid unnecessary navigation
- Keep `clients.openWindow()` for cold-start case

```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawPath = event.notification.data?.url 
    || event.notification.data?.athleteUrl 
    || '/';
  const targetUrl = new URL(rawPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Already on target URL — just focus
      for (const c of windowClients) {
        if (c.url === targetUrl && 'focus' in c) {
          return c.focus();
        }
      }

      // PWA open on different page — focus + force navigate (critical for iOS)
      if (windowClients.length > 0) {
        const client = windowClients[0];
        return client.focus().then((c) => {
          if (c && 'navigate' in c) {
            return c.navigate(targetUrl).then(() => {
              // Secondary: clear Radix body locks via postMessage
              c.postMessage({ type: "PUSH_NAVIGATE", url: rawPath });
            });
          }
        });
      }

      // Cold start — open new window
      return clients.openWindow(targetUrl);
    })
  );
});
```

**File 2: `src/hooks/useForegroundPush.ts`** — Keep existing `PUSH_NAVIGATE` listener as-is

The postMessage listener remains as a safety net for clearing Radix UI body locks. No changes needed — the dual approach (navigate + postMessage) ensures both URL routing and UI cleanup work on iOS.

### Why This Fixes iOS

1. **Wrong data key** (`athleteUrl` vs `url`) — fixed by reading `data.url` first
2. **`postMessage`-only approach** — iOS frozen tabs don't receive messages reliably; `client.navigate()` is the WebKit-blessed API for service worker navigation
3. **`setTimeout` removed** — `navigate()` inside `waitUntil` is synchronous intent; no delay needed

