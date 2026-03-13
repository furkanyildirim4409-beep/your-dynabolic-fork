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
  // iOS WebKit prefers absolute URLs for openWindow
  const targetUrl = new URL(rawPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        // Find focused window or default to the first one
        let client = windowClients[0];
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) {
            client = windowClients[i];
            break;
          }
        }

        // CRITICAL FOR IOS: Focus FIRST, then navigate
        if ('focus' in client) {
          return client.focus().then((c) => {
            if ('navigate' in c) {
              return c.navigate(targetUrl);
            }
          });
        }
      }

      // If no window is open
      return clients.openWindow(targetUrl);
    })
  );
});
