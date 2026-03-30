

# Part 2: Operations Bento Grid

## Single file edit: `src/pages/CoachWaitlist.tsx`

### 1. Add new imports (line 3)
Add `Users`, `RefreshCw`, `Pill`, `TrendingUp`, `Camera` to the lucide-react import.

### 2. Add `operationsFeatures` array (after `coreEngineFeatures`, ~line 39)

| # | Icon | colSpan | Title | Description |
|---|------|---------|-------|-------------|
| 6 | `Users` | 2 | Merkezi Komuta Paneli | Yüzlerce sporcuyu tek ekranda... WhatsApp karmaşasına son |
| 7 | `RefreshCw` | 1 | Canlı Program Revizesi | Değişiklikler anında sporcunun telefonunda güncellenir |
| 8 | `Pill` | 1 | Gelişmiş Supplement Protokolleri | Kreatin, vitamin, kür döngüleri... miligramına kadar planla |
| 9 | `TrendingUp` | 1 | Progressive Overload Takibi | Volume Load haftalık grafikler... platoya giren sporcuları bildir |
| 10 | `Camera` | 1 | Form & Postür Analizi | Ön/arka/yan form fotoğrafları... slider ile görselleştir |

### 3. Insert Phase 2 JSX section (between Core Engine closing `</motion.section>` at line 248 and Trust Banner at line 250)

New `motion.section` with `pt-8 md:pt-12 pb-32` spacing:
- Eyebrow: "Faz 2: Operasyon" — same neon green mono style
- Headline: "Saha Kontrolü ve Atlet Yönetimi"
- Grid: identical 3-col layout, same card styling with radial gradient glow
- Card 6 spans `md:col-span-2`, rest span 1
- Same `whileInView` stagger animation using existing `container`/`item` variants

### 4. Everything else untouched
Trust banner, form, footer remain in place below Phase 2.

