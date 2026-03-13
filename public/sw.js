// v2.0 - Foreground relay + Background push + Deep linking

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Bildirim", body: "", data: {} };
  try { data = event.data.json(); } catch { data.body = event.data?.text() || ""; }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const focusedClient = clientList.find((c) => c.visibilityState === "visible");

      if (focusedClient) {
        // App is in foreground — relay to React for in-app toast
        focusedClient.postMessage({
          type: "PUSH_FOREGROUND",
          payload: data,
        });
        // Don't show system notification
        return;
      }

      // App is backgrounded/closed — show system notification
      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/pwa-icon-192.png",
        badge: "/favicon.ico",
        data: data.data || {},
        vibrate: [200, 100, 200],
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const path = event.notification.data?.athleteUrl || event.notification.data?.url || "/";
  const urlToOpen = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("navigate" in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
