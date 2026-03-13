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

  const rawPath = event.notification.data?.athleteUrl || '/';
  const targetUrl = new URL(rawPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        let client = windowClients.find(c => c.focused) || windowClients[0];

        return client.focus().then((c) => {
          if (!c) return;
          // Give mobile webview 100ms to unfreeze before routing
          setTimeout(() => {
            c.postMessage({ type: "PUSH_NAVIGATE", url: rawPath });
          }, 100);
          // DO NOT call c.navigate() here — trust React Router to avoid race condition
        });
      }
      // If fully killed
      return clients.openWindow(targetUrl);
    })
  );
});
