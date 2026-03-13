
Hedef: Push sistemini Coach projesindeki sağlam mimariye taşımak ve “uygulama kapalıyken push + tıklamada doğru deep link” davranışını garanti etmek.

1) Kök neden analizi (tespit)
- Yayındaki `sw.js` şu an Workbox tarafından üretilmiş dosya; push listener içermiyor. Bu yüzden `public/sw.js` içindeki `push/notificationclick` kodu prod’da efektif değil.
- `usePushNotifications` `VITE_VAPID_PUBLIC_KEY` bekliyor; mevcut frontend env’de bu anahtar yok. Yeni abonelikler bu nedenle başarısız kalabiliyor.
- Push abonelik akışı sadece Profil > Settings paneli içinde tetikleniyor; kullanıcı profil ekranına hiç girmezse abonelik oluşmuyor.

2) Yeniden inşa planı (Coach mimarisiyle hizalı)
- `public/sw.js` yaklaşımını bırakıp Workbox’a push script import edeceğim:
  - Yeni dosya: `public/sw-push.js`
  - `vite.config.ts` içinde `VitePWA.workbox.importScripts = ["/sw-push.js"]`
- `sw-push.js` içinde:
  - `push` event: payload parse et, app görünür client varsa `postMessage(PUSH_FOREGROUND)`, yoksa `showNotification`.
  - `notificationclick` event: `athleteUrl || url || "/"` çöz, açık pencere varsa `navigate + focus`, yoksa `openWindow`.
- Böylece tek service worker hattı olacak (prod/dev davranışı tutarlı).

3) Abonelik katmanını baştan düzenleme
- Yeni edge function: `supabase/functions/get-vapid-public-key/index.ts`
  - `VAPID_PUBLIC_KEY` secret’ını güvenli şekilde client’a döner.
  - CORS destekli.
- `supabase/config.toml` içine function config eklenecek.
- `src/hooks/usePushNotifications.ts` yeniden yazılacak:
  - `navigator.serviceWorker.ready` kullanacak (manuel `/sw.js` register yok).
  - `supabase.functions.invoke("get-vapid-public-key")` ile public key çekecek.
  - `getSubscription()` ile mevcut aboneliği tespit edip `push_subscriptions` tablosuna upsert/sync yapacak.
  - Gerekirse `subscribe()` ile izin isteyip yeni abonelik oluşturacak.
- `AppShell` seviyesinde sessiz “sync on login” çalıştırılacak (izin zaten granted ise otomatik toparlama).

4) Foreground bildirimleri sağlamlaştırma
- `src/hooks/useForegroundPush.ts` geliştirilecek:
  - SW `postMessage` listener korunacak.
  - Realtime `messages` fallback eklenecek (app açıkken push relay kaçırılırsa da toast gelsin).
  - Dedupe için message-id temelli koruma eklenecek (çift toast engeli).
- `send-chat-push` payload’ına `messageId` eklenecek (dedupe için).

5) Deep link sertleştirme
- Chat için hedef URL standardı korunacak: `/?openChat=true&coachId=...`
- Ek uyumluluk için `/messages` route alias/redirect (athlete app’te chat açacak şekilde) eklenecek; böylece dış payload `/messages` gelse de ana sayfaya düşme sorunu yaşanmayacak.
- Mevcut `/antrenman`, `/odemeler` gibi doğrudan rota deep link’leri olduğu gibi desteklenecek.

6) Doğrulama planı (uçtan uca)
```text
Mesaj INSERT -> DB trigger -> send-chat-push ->
SW push handler ->
  (foreground) postMessage -> toast -> "Görüntüle" -> deep link
  (background/closed) system notification -> click -> navigate/focus -> deep link
```
- DB: `push_subscriptions` içinde atlet kullanıcı için aktif endpoint doğrulanacak.
- Edge: `send-chat-push` çağrısında `sent > 0` doğrulanacak.
- UI:
  - App açık: toast + “Görüntüle” chat açıyor.
  - App arka plan/kapalı: sistem bildirimi geliyor, tıklayınca hedef sayfaya gidiyor.
- Yayın kontrolü: deployed `/sw.js` içinde push import hattı (sw-push) doğrulanacak; böylece prod’da tekrar bozulma engellenecek.

Değişecek dosyalar
- `vite.config.ts`
- `public/sw-push.js` (yeni)
- `src/hooks/usePushNotifications.ts`
- `src/hooks/useForegroundPush.ts`
- `src/components/AppShell.tsx`
- `src/App.tsx` (route alias gerekiyorsa)
- `supabase/functions/get-vapid-public-key/index.ts` (yeni)
- `supabase/functions/send-chat-push/index.ts`
- `supabase/config.toml`
