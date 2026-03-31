

# Part 2: Athlete Waitlist — "Hardcore Performans & Takip" Bento Grid

## Single file: `src/pages/Waitlist.tsx`

### 1. Update imports (line 3)
Add `TrendingUp`, `Medal`, `Timer`, `Gauge`, `Watch`, `FileText` to the existing lucide-react import.

### 2. Add `performanceFeaturesAthletes` array (after `analysisFeaturesAthletes`, ~line 62)

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `TrendingUp` | `md:col-span-2 lg:col-span-2` | Progressive Overload Radarı |
| 2 | `Medal` | `md:col-span-1 lg:col-span-1` | PR & Rekor Arşivi |
| 3 | `Timer` | `md:col-span-1 lg:col-span-1` | Gelişmiş Rest Timer |
| 4 | `Gauge` | `md:col-span-2 lg:col-span-2` | RPE & Tempo Kontrolü |
| 5 | `Watch` | `md:col-span-1 lg:col-span-1` | Giyilebilir Cihaz Senkronu |
| 6 | `FileText` | `md:col-span-1 lg:col-span-1` | Özel Antrenman Notları |

Full descriptions from the spec included.

### 3. Insert Phase 2 section JSX (after line 257, before the FORM section)
- `motion.section` with `whileInView` stagger animation using `gridStagger`/`gridItem`
- Container: `max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 pb-32`
- Eyebrow: "FAZ 2: HARDCORE PERFORMANS & TAKİP"
- Headline: "Antrenmanınızı Bilimsel Bir Şova Dönüştürün" (`text-3xl md:text-5xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`
- Cards: identical styling to Phase 1 (`bg-[#0a0a0a]`, radial gradient, GPU classes, neon hover)
- Maps over `performanceFeaturesAthletes`

### What stays untouched
- Hero, scroll indicator, Phase 1 section
- Form logic, success state, footer
- All animation variants

