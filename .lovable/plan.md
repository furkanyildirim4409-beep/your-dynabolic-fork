

## Deep Link Sorunu -- Kök Neden ve Çözüm

### Sorun

Kokpit'teki chat açma deep link'i (`/?openChat=true`) **sadece component mount'ta** çalışıyor (satır 70-76, `useEffect([], [])`). Kullanıcı zaten Kokpit'teyken:

1. **Foreground toast** "Görüntüle" tıklanır → `navigate("/?openChat=true&coachId=xxx")` çağrılır
2. React Router aynı route'ta olduğu için **component'ı yeniden mount etmez**
3. `useEffect([], [])` tekrar çalışmaz → **chat açılmaz**

Aynı sorun SW `notificationclick`'te de geçerli: app zaten açıksa `client.navigate()` sayfayı yeniden yüklemez, sadece URL'i değiştirir.

### Çözüm

İki katmanlı düzeltme:

**1. Kokpit.tsx** -- `window.location.search` yerine React Router'ın `useSearchParams` hook'unu kullan:
- `useSearchParams()` ile query param değişikliklerini reaktif olarak dinle
- `openChat=true` geldiğinde `setShowChat(true)` çağır ve param'ı temizle
- Bu sayede aynı route'tayken de deep link çalışır

**2. useForegroundPush.ts** -- Toast action'da `navigate` yerine doğrudan state yönetimi:
- Toast "Görüntüle" tıklandığında `navigate("/?openChat=true")` yerine bir custom event dispatch et (`open-coach-chat`)
- Kokpit zaten bu event'i dinliyor (satır 78-80'deki `openCoachChat` listener)
- Böylece navigate gereksiz olur, chat anında açılır

**3. sw-push.js** -- Background'dan gelince URL tabanlı deep link zaten çalışır (sayfa yeniden yüklenir), ama app açıkken client.navigate sorununu çözmek için foreground relay'e güven.

### Değişecek dosyalar
- `src/pages/Kokpit.tsx` -- `useSearchParams` ile reaktif deep link
- `src/hooks/useForegroundPush.ts` -- Toast action'da custom event dispatch

