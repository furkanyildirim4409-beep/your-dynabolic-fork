/* Push notification handler — imported by Workbox via importScripts */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || 'Dynabolic';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/pwa-icon-192.png',
      badge: payload.badge || '/favicon.ico',
      data: payload.data || {},
      vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('SW push parse error:', err);
  }
});

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
