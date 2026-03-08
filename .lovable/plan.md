

# Eksik Bileşen ve Sayfa Karşılaştırması -- 4 Part Plan

## Tespit Edilen Tüm Farklar

Kaynak proje ile mevcut proje arasında dosya listesi aynı, ancak **içerik olarak 30+ dosya** hala stub/kısa versiyonda. İşte tam liste:

### STUB BİLEŞENLER (1-3 satır, orijinalde 100-1071 satır)

| # | Dosya | Mevcut | Orijinal | Fark |
|---|-------|--------|----------|------|
| 1 | `ChallengesSection.tsx` | 2 satır | 252 satır | Tamamen stub |
| 2 | `ChallengeHistoryModal.tsx` | 2 satır | 322 satır | `null` döndürüyor |
| 3 | `DisputeResolutionModal.tsx` | 3 satır | 528 satır | `null` döndürüyor |
| 4 | `DisputeNotificationBell.tsx` | 3 satır | 199 satır | Sadece ikon |
| 5 | `VisionAIExecution.tsx` | 8 satır | 1071 satır | Demo placeholder |
| 6 | `BodyScanUpload.tsx` | 2 satır | 302 satır | Demo placeholder |
| 7 | `BloodworkUpload.tsx` | 4 satır | 302 satır | Demo placeholder |
| 8 | `PaymentModal.tsx` | 3 satır | 390 satır | Minimal placeholder |
| 9 | `PaymentReceiptModal.tsx` | 2 satır | 252 satır | Minimal placeholder |
| 10 | `ProductDetail.tsx` | 2 satır | 167 satır | Minimal placeholder |
| 11 | `QuickActionFAB.tsx` | 2 satır | 258 satır | `null` döndürüyor |
| 12 | `NextMissionCard.tsx` | 2 satır | 85 satır | Tek satır |
| 13 | `SettingsPanel.tsx` | 2 satır | 447 satır | Placeholder |
| 14 | `TransformationTimeline.tsx` | 2 satır | 696 satır | Placeholder |
| 15 | `AchievementUnlockNotification.tsx` | 20 satır | 202 satır | Basitleştirilmiş |

### KISA SAYFALAR (orijinalinden önemli ölçüde kısa)

| # | Dosya | Mevcut | Orijinal | Fark |
|---|-------|--------|----------|------|
| 16 | `Kokpit.tsx` | 156 satır | 412 satır | Steps progress bar, weekly recap button, notification click handler eksik |
| 17 | `Antrenman.tsx` | 129 satır | 449 satır | Calendar/list toggle, workout history overlay, detail modal, exercise accordion eksik |
| 18 | `Beslenme.tsx` | 123 satır | ~1025 satır | Çok kısa |
| 19 | `Kesfet.tsx` | 98 satır | ~605 satır | Çok kısa |
| 20 | `Profil.tsx` | 106 satır | ~417 satır | Çok kısa |
| 21 | `Akademi.tsx` | 75 satır | ~350 satır | Çok kısa |
| 22 | `Tarifler.tsx` | 71 satır | ~300 satır | Çok kısa |
| 23 | `CoachProfile.tsx` | 124 satır | ~450 satır | Kısa |
| 24 | `Odemeler.tsx` | 67 satır | Kaynak projede yok (Payments.tsx var) | Ayrı dosya |

### EKSİK/FARKLI HOOK ve LIB DOSYALARI

| # | Dosya | Durum |
|---|-------|-------|
| 25 | `usePaymentReminders.ts` | Stub (boş array döndürüyor) |
| 26 | `useDisputeNotifications.ts` | Kontrol edilmeli |
| 27 | `useScrollDirection.ts` | Kontrol edilmeli |
| 28 | `index.css` | CSS class'lar (glass-card-premium, neon-glow, grid-pattern vb.) kontrol edilmeli |
| 29 | `App.tsx` | Routing doğru ama splash screen logic farklı olabilir |

---

## 4 PART UYGULAMA PLANI

### PART 1: Temel UI Bileşenleri (8 dosya, ~2100 satır)
Dur ve "devam et" demeni bekle.

1. **`NextMissionCard.tsx`** -- 85 satır (gradient background, play button, meta row)
2. **`QuickActionFAB.tsx`** -- 258 satır (FAB menü, su/ağırlık/koç/akademi/tarifler/ödemeler/hizmetler)
3. **`SettingsPanel.tsx`** -- 447 satır (bildirimler, dil, görünüm, çevrimdışı, veri export, hesap)
4. **`AchievementUnlockNotification.tsx`** -- 202 satır (confetti, tier renkleri, XP animasyonu)
5. **`ProductDetail.tsx`** -- 167 satır (ürün detay drawer, rating, bio-coin bilgisi)
6. **`PaymentModal.tsx`** -- 390 satır (kredi kartı form, havale bilgileri, IBAN kopyalama)
7. **`PaymentReceiptModal.tsx`** -- 252 satır (jsPDF makbuz, indirme)
8. **`NextMissionCard.tsx`** zaten sayıldı -- yerine **`DisputeNotificationBell.tsx`** -- 199 satır (bildirim paneli, okundu işaretleme)

### PART 2: Karmaşık Bileşenler (7 dosya, ~3600 satır)
Dur ve "devam et" demeni bekle.

1. **`VisionAIExecution.tsx`** -- 1071 satır (tam antrenman modoru: swipe, RPE, HR, rest timer, exercise history, workout summary)
2. **`ChallengesSection.tsx`** -- 252 satır (filtreler, challenge listesi, stats grid)
3. **`ChallengeHistoryModal.tsx`** -- 322 satır (düello geçmişi, win/loss tab'ları)
4. **`DisputeResolutionModal.tsx`** -- 528 satır (itiraz formu, mesajlaşma, kanıt)
5. **`BodyScanUpload.tsx`** -- 302 satır (ön/yan fotoğraf yükleme, progress)
6. **`BloodworkUpload.tsx`** -- 302 satır (dosya yükleme, rapor listesi, detay)
7. **`TransformationTimeline.tsx`** -- 696 satır (fotoğraf karşılaştırma, slider, pinch zoom)

### PART 3: Tüm Sayfalar (8 dosya, ~3500+ satır)
Dur ve "devam et" demeni bekle.

1. **`Kokpit.tsx`** -- 412 satır (orijinal tam versiyonu: steps progress bar, weekly recap test button, notification click handler)
2. **`Antrenman.tsx`** -- 449 satır (liste/takvim toggle, workout history overlay, exercise accordion detail modal)
3. **`Beslenme.tsx`** -- ~1025 satır (orijinal tam versiyonu)
4. **`Kesfet.tsx`** -- ~605 satır (orijinal tam versiyonu)
5. **`Profil.tsx`** -- ~417 satır (orijinal tam versiyonu)
6. **`Akademi.tsx`** -- ~350 satır (orijinal tam versiyonu)
7. **`Tarifler.tsx`** -- ~300 satır (orijinal tam versiyonu)
8. **`CoachProfile.tsx`** -- ~450 satır (orijinal tam versiyonu)

### PART 4: Hook'lar, CSS, Son Düzeltmeler (5-8 dosya)
Dur ve "devam et" demeni bekle.

1. **`usePaymentReminders.ts`** -- Orijinal tam implementasyon
2. **`useDisputeNotifications.ts`** -- Orijinal tam implementasyon
3. **`useScrollDirection.ts`** -- Orijinal tam implementasyon
4. **`index.css`** -- Eksik CSS class'ları (glass-card-premium, neon-glow, stat renkleri vb.)
5. **`App.tsx`** -- Splash screen logic ve routing son kontrol
6. **Tüm TypeScript hataları** -- Import/export uyumsuzlukları giderilecek
7. **`mockData.ts`** -- Eksik export'lar (bloodworkReports vb.)
8. **`Odemeler.tsx`** kaldırılacak (Payments.tsx zaten var)

---

**Toplam:** ~30 dosya, ~9000+ satır kod. Her part'ın sonunda duracağım ve "devam et" demenizi bekleyeceğim.

