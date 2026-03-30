

# Part 1: Core Engine Bento Grid

## What changes

Replace the old 4-card Feature Matrix section (lines 8-33 data + lines 200-240 JSX) with a new 5-card "Core Engine & AI" Bento Grid using a 3-column layout.

## Single file edit: `src/pages/CoachWaitlist.tsx`

### 1. Replace the `features` array (lines 8-33) with `coreEngineFeatures`

5 entries, each with `icon`, `title`, `description`, and `colSpan` (1 or 2):

| # | Icon | colSpan | Title | Description (truncated) |
|---|------|---------|-------|------------------------|
| 1 | `Cpu` | 2 | Otonom Uyum Skoru & Sapma Radarı | Yapay zeka ile makro/antrenman sadakati... Kritik Mudahale listesi |
| 2 | `Zap` | 1 | Sıfır Gecikmeli SWR Mimari | Loading ekranlarını tarihe gomun... milisaniyeler |
| 3 | `Calculator` | 1 | Dinamik Gramaj Algoritması | 100g yulaf yerine 150g... 1.5x carpan |
| 4 | `BatteryCharging` | 1 | Akıllı Rest Day Optimizasyonu | Dinlenme gunlerinde makro/kalori... BMR duyarli |
| 5 | `Database` | 1 | Kurumsal Veri Izolasyonu | RLS ile sifreleme... askeri duzey koruma |

### 2. Update imports

Remove `Gauge`, `Target`, `Users`. Add `Cpu`, `Calculator`, `BatteryCharging`, `Database`.

### 3. Replace Feature Matrix JSX (lines 200-240)

New section with:
- Eyebrow: `"FAZ 1: MUHENDİSLİK"` — neon green, `tracking-[0.3em]`, `text-xs`, `font-mono`, uppercase
- Headline: `"Sınırları Zorlayan Cekirdek Motor"` — `text-2xl sm:text-3xl md:text-4xl`, bold, white
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto`
- Each card: `bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-3xl p-6 md:p-8 hover:border-[#CCFF00]/40 transition-all duration-500 relative overflow-hidden`
- Inner radial gradient pseudo-glow via inline style: `radial-gradient(ellipse at 30% 0%, hsla(68,100%,50%,0.04), transparent 70%)`
- Card 1 spans `md:col-span-2`, rest `md:col-span-1`
- Icon in neon-bordered circle (same pattern as before), title, description
- `whileInView` stagger animation on the section and each card

### 4. Everything else untouched

Trust banner, form, footer remain identical.

