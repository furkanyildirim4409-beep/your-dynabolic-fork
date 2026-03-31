

# Part 4: Add "Kurumsallaşma & Süper Admin" (6 Features, 4-col Grid)

## Single file: `src/pages/CoachWaitlist.tsx`

### 1. Update imports (line 3)
Add `Wallet`, `ShieldCheck`, `Radar`, `Coins`, `Scale`, `Building2` to the existing lucide-react import.

### 2. Add `adminFeatures` array after `engineeringFeatures` (after line 117)
New array with 6 features:

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `Wallet` | `md:col-span-2 lg:col-span-2` | Otonom Fatura & Hak Ediş Merkezi |
| 2 | `ShieldCheck` | `md:col-span-1 lg:col-span-1` | Hiyerarşik İzin Matrisi |
| 3 | `Radar` | `md:col-span-1 lg:col-span-1` | Churn (Kayıp) Risk Radarı |
| 4 | `Coins` | `md:col-span-2 lg:col-span-2` | BioCoin & Gelişmiş Oyunlaştırma |
| 5 | `Scale` | `md:col-span-1 lg:col-span-1` | Anlaşmazlık Çözüm Merkezi |
| 6 | `Building2` | `md:col-span-1 lg:col-span-1` | Kurumsal White-Label Otoritesi |

Full descriptions from the spec included.

### 3. Insert Phase 4 section JSX (after line 439, before Trust Banner)
- Same `motion.section` wrapper with `whileInView` stagger as Phases 1-3
- Eyebrow: "FAZ 4: KURUMSALLAŞMA & SÜPER ADMİN"
- Headline: "Bir Antrenörden Çok, Bir Teknoloji Şirketi Olun" (`text-3xl md:text-5xl`)
- Container: `max-w-[1400px] mx-auto mt-32 px-6 pb-32`
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`
- Cards: identical styling to Phases 1-3 (`bg-[#0a0a0a]`, radial gradient, GPU classes)
- Maps over `adminFeatures`

### What stays untouched
- Hero, scroll indicator, Phases 1-3, Trust Banner, form, footer
- All animation variants

