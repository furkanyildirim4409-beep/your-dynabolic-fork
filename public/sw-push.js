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
  const rawUrl = notifData.athleteUrl || notifData.url || "/";
  const relativeUrl =
    typeof rawUrl === "string" && rawUrl.startsWith("/")
      ? rawUrl
      : `/${String(rawUrl || "").replace(/^\/+/, "")}`;
  const absoluteUrl = new URL(relativeUrl, self.location.origin).toString();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // iOS: navigate BEFORE focus for best reliability
            await client.navigate(relativeUrl);
            return client.focus();
          }
        }
        return clients.openWindow(absoluteUrl);
      })
  );
});
