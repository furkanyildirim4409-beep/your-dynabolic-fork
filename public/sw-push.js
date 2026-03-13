// sw-push.js — Injected into Workbox SW via importScripts
// Handles push events and notification clicks with deep linking

self.addEventListener("push", (event) => {
  let data = { title: "Bildirim", body: "", data: {} };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text() || "";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const focusedClient = clientList.find(
          (c) => c.visibilityState === "visible"
        );

        if (focusedClient) {
          // App is in foreground — relay to React for in-app toast
          focusedClient.postMessage({
            type: "PUSH_FOREGROUND",
            payload: data,
          });
          return;
        }

        // App is backgrounded/closed — show system notification
        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/pwa-icon-192.png",
          badge: "/favicon.ico",
          data: data.data || {},
          vibrate: [200, 100, 200],
          tag: data.data?.messageId || undefined,
        });
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const path = notifData.athleteUrl || notifData.url || "/";
  const urlToOpen = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window and navigate it
        for (const client of clientList) {
          if ("navigate" in client) {
            return client.navigate(urlToOpen).then((c) => c?.focus());
          }
        }
        // No existing window — open a new one
        return clients.openWindow(urlToOpen);
      })
  );
});
