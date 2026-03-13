

## iOS Push Bildirim Sorunu -- Kök Neden Analizi

### Çalışan Koç Paneli SW vs. Bizim SW

**Çalışan (Koç Paneli):**
```javascript
self.addEventListener('push', (event) => {
  const payload = event.data.json();
  event.waitUntil(self.registration.showNotification(title, options));
  // ↑ DOĞRUDAN çağrı — sıfır async gecikme
});
```

**Bizim (Kırık):**
```javascript
self.addEventListener('push', (event) => {
  event.waitUntil(
    clients.matchAll(...)          // ← 1. async adım
      .then((clientList) => {
        // postMessage relay...     // ← 2. async adım
        return self.registration.showNotification(...);  // ← GECİKMELİ çağrı
      })
  );
});
```

### Kök Neden

**iOS WebKit, `showNotification()` çağrısının `push` event handler'ında mümkün olan en kısa sürede yapılmasını zorunlu kılıyor.** Bizim kodda `clients.matchAll().then()` promise zinciri, `showNotification`'ı 1-2 async tick geciktirir. Desktop/Android bunu tolere eder ama iOS WebKit push event'i timeout'a uğratıp sessizce yutabilir.

### Çözüm

Koç panelindeki kanıtlanmış pattern'i uygula:

**`public/sw-push.js`:**
- `showNotification()`'ı doğrudan `event.waitUntil()` içinde çağır — `clients.matchAll` zinciri içine KOYMA
- `postMessage` relay'ini ayrı bir `event.waitUntil()` bloğunda yap (veya `showNotification` sonrasına zincirle)
- `tag` property'sini koru (bildirim deduplication için faydalı)
- `vibrate` ekleme (iOS desteklemiyor, zaten yok)

Sonuç:
```javascript
self.addEventListener("push", (event) => {
  let data = { title: "Bildirim", body: "", data: {} };
  try { data = event.data.json(); } catch { data.body = event.data?.text() || ""; }

  // iOS WebKit: showNotification MUST be called immediately
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
```

### Değişecek dosya
- `public/sw-push.js` — `showNotification`'ı doğrudan çağır, `postMessage`'ı ayrı `waitUntil`'e taşı

