

# Dynabolic Projesi Kopyalama Planı

Orijinal [DYNABOLIC](/projects/30c062d5-06f7-431f-84d9-0b6f4c49642a) projesi workspace'inizde mevcut. Tüm dosyaları bu projeye kopyalayacağım.

## Proje Boyutu

- **18 sayfa**: Login, Kokpit, Antrenman, Beslenme, Kesfet, Profil, Akademi, Tarifler, vb.
- **70+ bileşen**: AppShell, EliteDock, CoachChat, DigitalTwinAvatar, WorkoutCard, vb.
- **5 context**: Auth, Cart, Offline, Settings, Story
- **9 hook**: Achievements, Streaks, Payments, vb.
- **5 lib dosyası**: mockData, challengeData, gamificationData, haptics, utils
- **1 types dosyası**: shared-models.ts

## Tema

Koyu siyah zemin + neon yeşil (lime) vurgu rengi, glassmorphic kartlar.

## Ek Bağımlılıklar (Yüklenecek)

- `framer-motion` (animasyonlar)
- `three`, `@react-three/fiber`, `@react-three/drei` (3D avatar)
- `canvas-confetti` (kutlama efektleri)
- `jspdf` (PDF oluşturma)
- `@supabase/supabase-js` (veritabanı)

## Uygulama Adımları

1. **Ek paketleri yükle** (framer-motion, three, canvas-confetti, jspdf, @supabase/supabase-js)
2. **Temel yapılandırma dosyalarını kopyala**: tailwind.config.ts, index.css, index.html
3. **Tüm context dosyalarını kopyala** (5 dosya)
4. **Tüm hook dosyalarını kopyala** (9 dosya)
5. **Types ve lib dosyalarını kopyala** (6 dosya)
6. **Tüm bileşenleri kopyala** (~73 dosya)
7. **Tüm sayfaları kopyala** (18 dosya)
8. **App.tsx'i güncelle** (routing ve provider yapısı)
9. **Supabase bağlantısını mevcut projenin veritabanına yönlendir**

Toplam ~120 dosya kopyalanacak. Bu çok aşamalı bir süreç olacak.

