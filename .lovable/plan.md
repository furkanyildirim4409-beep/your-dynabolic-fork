

# Part 3: Athlete Waitlist — "Biyometri & Yaşam Tarzı" Bento Grid

## Single file: `src/pages/Waitlist.tsx`

### 1. Update imports (line 3)
Add `HeartPulse`, `Pill`, `Droplets`, `Flame`, `Video`, `ImagePlus` to the existing lucide-react import.

### 2. Add `lifestyleFeaturesAthletes` array (after line 101, before `const Waitlist`)

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `HeartPulse` | `md:col-span-2 lg:col-span-2` | HRV & Rejenerasyon Analizi |
| 2 | `Pill` | `md:col-span-1 lg:col-span-1` | Supplement Takvimi |
| 3 | `Droplets` | `md:col-span-1 lg:col-span-1` | Su & Hidrasyon |
| 4 | `Flame` | `md:col-span-2 lg:col-span-2` | Carb-Cycling (Karbonhidrat Döngüsü) |
| 5 | `Video` | `md:col-span-1 lg:col-span-1` | Haftalık Otomatik Recap |
| 6 | `ImagePlus` | `md:col-span-1 lg:col-span-1` | Form Fotoğrafı Arşivi |

Full descriptions from the spec included.

### 3. Insert Phase 3 section JSX (after line 339, before the form `<div>` at line 341)
- `motion.section` with `whileInView` stagger using existing `gridStagger`/`gridItem` variants
- Container: `max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 pb-32`
- Eyebrow: "FAZ 3: BİYOMETRİ & YAŞAM TARZI"
- Headline: "Sadece Salonda Değil, 7/24 Kusursuz Takip" (`text-3xl md:text-5xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`
- Cards: identical styling to Phases 1-2 (`bg-[#0a0a0a]`, radial gradient, GPU classes, neon hover)
- Maps over `lifestyleFeaturesAthletes`

### What stays untouched
- Hero, scroll indicator, Phases 1-2
- Form logic, success state, footer
- All animation variants

