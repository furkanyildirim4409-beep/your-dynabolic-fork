

# Dynabolic Tam Kopyalama Planı

## Mevcut Durum

Projenin şu anki hali orijinal Dynabolic projesinden **çok eksik**:

- **20+ bileşen stub** (tek satırlık placeholder): PerformanceRing, StoriesRing, QuickStatsRow, WeeklyActivityChart, BentoStats, BiometricDetailModal, DailyCheckIn, StatDetailModal, StreakTierWidget, VisionAIExecution, WorkoutCalendar, ExerciseGoalsSection, SupplementTracker, SettingsPanel, RealisticBodyAvatar, StoryViewer, UniversalCartDrawer, FloatingCartButton, SupplementShop, CoachChat, vb.
- **20+ bileşen tamamen eksik**: ChallengeCard, ChallengeDetailModal, ChallengeProofSubmission, ChallengeStreakBanner, CreateChallengeModal, CartView, CoachUplink, DailyFocusCard, DigitalTwinAvatar, DynabolicLogo, EnergyBank, ExerciseGoalModal, ExerciseHistoryModal, ExerciseRestTimerOverlay, MacroDashboard, NutriScanner, NutritionHistory, PersonalRecords, RestTimerOverlay, BioMetricsDashboard, BloodworkDetailModal
- **7 sayfa eksik**: Achievements, Leaderboard, Payments, ResetPassword, SaglikTrendleri, Services, BiometricLogin
- **Mevcut sayfalar basitleştirilmiş**: Kokpit, Antrenman, Beslenme, Kesfet, Profil, Akademi, Tarifler, CoachProfile -- hepsi orijinale kıyasla çok kısa
- **mockData.ts eksik**: Orijinal 2583 satır, mevcut çok kısa
- **App.tsx routing eksik**: Yeni sayfaların route'ları yok

## Uygulama Planı (Çok aşamalı, ~120 dosya)

Mesaj limitleri nedeniyle bunu **4-5 aşamada** yapacağız:

### Aşama 1: Veri Katmanı
- `src/lib/mockData.ts` -- Orijinal 2583 satırlık dosyanın tamamı (coaches, exercises, workoutHistory, invoices, assignedSupplements, wearableMetrics, vb.)
- Context dosyalarını güncelle (StoryContext, CartContext)

### Aşama 2: Temel Bileşenler (20+ stub -> tam implementasyon)
Orijinal projeden birebir kopyalanacak:
- PerformanceRing, StoriesRing, QuickStatsRow, WeeklyActivityChart, BentoStats
- BentoStatDetailModal, BiometricDetailModal, StatDetailModal
- DailyCheckIn, StreakTierWidget, CoachChat, CoachAdjustmentBanner
- SettingsPanel, FloatingCartButton, UniversalCartDrawer, StoryViewer
- VisionAIExecution, WorkoutCalendar, ExerciseGoalsSection
- SupplementTracker, RealisticBodyAvatar, SupplementShop
- BioCoinWallet, WorkoutCard

### Aşama 3: Eksik Bileşenler (20+ yeni dosya)
- ChallengeCard, ChallengeDetailModal, ChallengeProofSubmission
- ChallengeStreakBanner, CreateChallengeModal, ChallengesSection
- CartView, CoachUplink, DailyFocusCard, DigitalTwinAvatar
- DynabolicLogo, EnergyBank, ExerciseGoalModal
- ExerciseHistoryModal, ExerciseRestTimerOverlay
- MacroDashboard, NutriScanner, NutritionHistory
- PersonalRecords, RestTimerOverlay, BioMetricsDashboard, BloodworkDetailModal

### Aşama 4: Sayfalar
Tüm sayfalarin orijinal tam versiyonları:
- Kokpit (412 satır), Antrenman (449 satır), Beslenme (1025 satır)
- Kesfet (605 satır), Profil (417 satır), Akademi, Tarifler
- CoachProfile, Login, Odemeler/Payments
- **Yeni sayfalar**: Achievements, Leaderboard, ResetPassword, SaglikTrendleri, Services

### Aşama 5: App.tsx & Veritabanı
- App.tsx routing guncellemesi (tum yeni sayfalar)
- Supabase tablolarına veri entegrasyonu (check-in, workout log, nutrition log)

## Veritabanı

Mevcut tablolar yeterli (profiles, user_roles, daily_checkins, workout_logs, nutrition_logs, water_logs, weight_logs). Ek tablo gerekmez -- orijinal proje de mock data kullanıyor.

## Toplam Dosya Sayısı

~100+ dosya kopyalanacak/güncellencek. Her aşamada maksimum dosya yazılacak.

