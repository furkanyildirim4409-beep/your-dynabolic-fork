

# Eksik Bileşenler ve Kaynak Proje Karşılaştırması

## Mevcut Durumda Eksik Olan 16 Bileşen

Kaynak projede mevcut ama bu projede **hiç bulunmayan** dosyalar:

| Bileşen | Satır | Açıklama |
|---------|-------|----------|
| `CartView.tsx` | 192 | Eski sepet görünümü (UniversalCartDrawer'dan farklı) |
| `DigitalTwinAvatar.tsx` | 292 | Three.js dijital ikiz avatar (kamera kontrolü, zoom, gesture hint) |
| `NutriScanner.tsx` | 288 | AI besin tarayıcı (kamera simülasyonu, tarama animasyonu) |
| `MacroDashboard.tsx` | 126 | Makro progress bar'ları (protein/karb/yağ) |
| `RestTimerOverlay.tsx` | 234 | Set arası dinlenme zamanlayıcı (dairesel timer, ses, +30sn) |
| `BioMetricsDashboard.tsx` | 321 | Biyometrik panel (RHR/HRV trend grafikleri, uyku aşamaları) |
| `BloodworkDetailModal.tsx` | 278 | Kan tahlili detay modalı (hormon trendi grafikleri) |
| `ChallengeDetailModal.tsx` | 717 | Meydan okuma detay (VS görünümü, mesajlaşma, kanıt, geçmiş) |
| `ChallengeProofSubmission.tsx` | 794 | Kanıt yükleme sistemi (fotoğraf/video, doğrulama, itiraz) |
| `CoachUplink.tsx` | 150 | Koç bağlantı widget'ı (hexagon avatar, durum göstergesi) |
| `DailyFocusCard.tsx` | 93 | Bugünkü odak kartı (ilerleme çubuğu, CTA) |
| `DynabolicLogo.tsx` | 61 | SVG animasyonlu D harfi + yıldırım logosu |
| `EnergyBank.tsx` | 117 | Batarya animasyonlu enerji göstergesi (dalga efekti) |
| `ExerciseGoalModal.tsx` | 280 | Hedef belirleme modalı (ağırlık/tekrar/süre ayarlama) |
| `ExerciseRestTimerOverlay.tsx` | 265 | Hareket arası dinlenme (sonraki hareket önizleme) |
| `NutritionHistory.tsx` | 150 | Beslenme geçmişi (7 günlük kayıtlar) |

## Eksik Sayfa

| Sayfa | Satır | Açıklama |
|-------|-------|----------|
| `BiometricLogin.tsx` | 216 | Biyometrik giriş ekranı (tarama animasyonu, ses efektleri) |

## Mevcut Kokpit Sayfası Karşılaştırması

Mevcut Kokpit: **156 satır** vs Orijinal: **412 satır**

Eksikler:
- `usePaymentReminders` hook entegrasyonu
- `useScrollDirection` hook entegrasyonu  
- Coach chat event listener (`openCoachChat`)
- Coach adjustment dismiss/localStorage mantığı
- Haftalık özet test butonu (scroll'a göre gizlenen)
- RHR ve Steps biometrik kartları (grid layout)
- Bildirim panelindeki detaylı notification rendering

## Uygulama Planı

### Adım 1: 16 Eksik Bileşeni Oluştur
Kaynak projeden birebir kopyalanarak oluşturulacak dosyalar (toplam ~4000 satır):
- `CartView.tsx`, `DigitalTwinAvatar.tsx`, `NutriScanner.tsx`, `MacroDashboard.tsx`
- `RestTimerOverlay.tsx`, `BioMetricsDashboard.tsx`, `BloodworkDetailModal.tsx`
- `ChallengeDetailModal.tsx`, `ChallengeProofSubmission.tsx`
- `CoachUplink.tsx`, `DailyFocusCard.tsx`, `DynabolicLogo.tsx`, `EnergyBank.tsx`
- `ExerciseGoalModal.tsx`, `ExerciseRestTimerOverlay.tsx`, `NutritionHistory.tsx`

### Adım 2: BiometricLogin Sayfasını Oluştur
- `src/pages/BiometricLogin.tsx` oluştur
- `App.tsx`'e `/biometric-login` route'u ekle

### Adım 3: Kokpit Sayfasını Güncelle
- Orijinal 412 satırlık Kokpit ile değiştir
- Eksik hook'ları (`usePaymentReminders`, `useScrollDirection`) entegre et
- RHR/Steps biometrik kartlarını ekle

### Adım 4: Tip Hatalarını Düzelt
- Tüm yeni bileşenlerin import'larını kontrol et
- `mockData.ts`'de eksik export'ları (`bloodworkTrends`, `flaggedBiomarkers`) ekle
- Build hatalarını gider

