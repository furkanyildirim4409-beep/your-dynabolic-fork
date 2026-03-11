// v1.2 — Push Notification Service Worker (absolute URLs + kokpit routing)

self.addEventListener("push", (event) => {
  let data = { title: "Bildirim", body: "", data: {} };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text() || "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: data.data || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.athleteUrl || event.notification.data?.url || "/kokpit";
  const urlToOpen = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(path) && "focus" in client) return client.focus();
        if ("navigate" in client) return client.navigate(urlToOpen).then(c => c?.focus());
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
