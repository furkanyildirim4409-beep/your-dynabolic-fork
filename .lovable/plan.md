

# Part 2: Replace Phase 2 with "Ekosistem & Ticaret" (6 Features, 4-col Grid)

## Single file: `src/pages/CoachWaitlist.tsx`

### 1. Update imports (line 3)
Add `Store`, `GraduationCap`, `LayoutTemplate`, `MessageSquare`, `Trophy` to lucide-react imports. Remove icons no longer needed by old `operationsFeatures` (`Users`, `TrendingUp`, `Camera`). Keep all icons used by Phase 1, Phase 3, and form.

### 2. Replace `operationsFeatures` array (lines 41-72)
Delete the current 5-feature array. Replace with new `ecosystemFeatures` array:

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `Store` | `md:col-span-2 lg:col-span-2` | Entegre E-Ticaret & Mini Mağaza |
| 2 | `GraduationCap` | `md:col-span-1 lg:col-span-1` | Akademi & Eğitim Modülü |
| 3 | `LayoutTemplate` | `md:col-span-1 lg:col-span-1` | İçerik & Sosyal Medya Stüdyosu |
| 4 | `Pill` | `md:col-span-2 lg:col-span-2` | Kapsamlı Supplement & Kür Shop |
| 5 | `MessageSquare` | `md:col-span-1 lg:col-span-1` | Merkezi İletişim Ağı (Chat) |
| 6 | `Trophy` | `md:col-span-1 lg:col-span-1` | Topluluk & Liderlik Tablosu |

Each feature uses the string-based `colSpan` format (matching Phase 1), with full descriptions from the spec.

### 3. Update Phase 2 section JSX (lines 339-382)
- Eyebrow: "FAZ 2: EKOSİSTEM & TİCARET"
- Headline: "Kendi Markanızı, Mağazanızı ve Akademisinizi Kurun" (`text-3xl md:text-5xl`)
- Container: `max-w-[1400px]` (was `max-w-6xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6` (match Phase 1)
- Cards: `bg-[#0a0a0a]` with string-based colSpan class, same radial gradient and GPU classes as Phase 1
- Map over `ecosystemFeatures` instead of `operationsFeatures`

### What stays untouched
- Hero, scroll indicator, Phase 1, Phase 3, trust banner, form, footer
- All animation variants
- GPU acceleration on all cards

