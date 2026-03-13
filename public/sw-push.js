// sw-push.js — Injected into Workbox SW via importScripts
// Handles push events and notification clicks with deep linking

self.addEventListener("push", (event) => {
  let data = { title: "Bildirim", body: "", data: {} };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text() || "";
  }

  // iOS WebKit: showNotification MUST be called immediately — zero async delay
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa-icon-192.png",
      badge: "/favicon.ico",
      data: data.data || {},
      tag: data.data?.messageId || undefined,
    })
  );

  // Foreground relay — separate waitUntil so it doesn't block notification
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const focused = clientList.find((c) => c.visibilityState === "visible");
      if (focused) {
        focused.postMessage({ type: "PUSH_FOREGROUND", payload: data });
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const path = notifData.athleteUrl || notifData.url || "/";
  // Build absolute URL — openWindow requires absolute, navigate works with both
  const targetUrl = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Try to find an existing window and navigate it
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Post message to handle navigation via React Router (avoids full reload)
            client.postMessage({
              type: "PUSH_NAVIGATE",
              url: path,
            });
            return client.focus();
          }
        }
        // No existing window — open a new one (must be absolute URL)
        return clients.openWindow(targetUrl);
      })
  );
});
