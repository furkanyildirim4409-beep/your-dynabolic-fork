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
        // Relay to foreground client for in-app toast (bonus)
        const focusedClient = clientList.find(
          (c) => c.visibilityState === "visible"
        );
        if (focusedClient) {
          focusedClient.postMessage({
            type: "PUSH_FOREGROUND",
            payload: data,
          });
        }

        // ALWAYS show system notification — iOS WebKit REQUIRES this
        // Skipping showNotification() on iOS causes silent push failure
        // and potential permission revocation
        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/pwa-icon-192.png",
          badge: "/favicon.ico",
          data: data.data || {},
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
        if (clientList.length > 0) {
          // Find a focused client, or default to the first one
          let target = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              target = clientList[i];
              break;
            }
          }
          // CRITICAL FOR IOS WEBKIT: focus() BEFORE navigate()
          return target.focus().then((c) => c.navigate(urlToOpen));
        }
        // App is fully killed — open a new window
        return clients.openWindow(urlToOpen);
      })
  );
});
