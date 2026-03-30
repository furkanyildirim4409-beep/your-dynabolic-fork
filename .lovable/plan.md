

# Part 3: Replace Phase 3 with "İleri Düzey Mühendislik & Biyometri" (6 Features, 4-col Grid)

## Single file: `src/pages/CoachWaitlist.tsx`

### 1. Update imports (line 3)
Add `Dumbbell`, `Utensils`, `TrendingUp`, `Watch`, `Camera`, `Accessibility` to lucide-react imports. Remove icons only used by old `financeFeatures` that aren't needed elsewhere: `Wallet`, `UserPlus`, `ShieldCheck`, `FileText`, `Medal`.

### 2. Replace `financeFeatures` array (lines 80-111)
Delete the current 5-feature array. Replace with new `engineeringFeatures` array:

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `Accessibility` | `md:col-span-2 lg:col-span-2` | 3D Dijital İkiz & Vücut Kompozisyonu |
| 2 | `Dumbbell` | `md:col-span-1 lg:col-span-1` | Makro-Saykıl Antrenman Planlayıcı |
| 3 | `Utensils` | `md:col-span-1 lg:col-span-1` | Mikro & Makro Beslenme Matrisi |
| 4 | `TrendingUp` | `md:col-span-2 lg:col-span-2` | Volume Load & Progressive Overload Radarı |
| 5 | `Watch` | `md:col-span-1 lg:col-span-1` | Giyilebilir Teknoloji & Cihaz Senkronizasyonu |
| 6 | `Camera` | `md:col-span-1 lg:col-span-1` | Vision AI Form & Postür Analizi |

Each feature uses string-based `colSpan` format matching Phase 1 & 2, with full descriptions from the spec.

### 3. Update Phase 3 section JSX (lines 390-433)
- Eyebrow: "FAZ 3: İLERİ DÜZEY MÜHENDİSLİK & BİYOMETRİ"
- Headline: "Sınırları Zorlayan Atletik Performans Yönetimi" (`text-3xl md:text-5xl`)
- Container: `max-w-[1400px]` (was `max-w-6xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6` (match Phase 1 & 2)
- Cards: `bg-[#0a0a0a]` with string-based colSpan class, same radial gradient and GPU classes
- Map over `engineeringFeatures` instead of `financeFeatures`

### What stays untouched
- Hero, scroll indicator, Phase 1 (AI Doctor), Phase 2 (Ecosystem)
- Trust banner, form, footer
- All animation variants (`heroContainer`, `heroItem`, `container`, `item`)

