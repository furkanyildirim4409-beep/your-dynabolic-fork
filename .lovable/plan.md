

# Part 4: Athlete Waitlist — "Ekosistem, Oyunlaştırma & Sosyal" Bento Grid

## Single file: `src/pages/Waitlist.tsx`

### 1. Update imports (line 3)
Add `Coins`, `Trophy`, `Swords`, `GraduationCap`, `MessageSquare`, `WifiOff` to the existing lucide-react import.

### 2. Add `ecosystemFeaturesAthletes` array (after `lifestyleFeaturesAthletes`, before `const Waitlist`)

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `Coins` | `md:col-span-2 lg:col-span-2` | BioCoin & Dijital Cüzdan |
| 2 | `Trophy` | `md:col-span-1 lg:col-span-1` | Global Liderlik Tablosu |
| 3 | `Swords` | `md:col-span-1 lg:col-span-1` | Sosyal Meydan Okumalar |
| 4 | `GraduationCap` | `md:col-span-2 lg:col-span-2` | Özel Eğitim Akademisi |
| 5 | `MessageSquare` | `md:col-span-1 lg:col-span-1` | Anlık Koç Chat & Sesli Not |
| 6 | `WifiOff` | `md:col-span-1 lg:col-span-1` | Çevrimdışı (Offline) Mod |

Full descriptions from the spec included.

### 3. Insert Phase 4 section JSX (after Phase 3 closing `</motion.section>` at line 421, before the form `<div>` at line 423)
- `motion.section` with `whileInView` stagger using existing `gridStagger`/`gridItem` variants
- Container: `max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 pb-32`
- Eyebrow: "FAZ 4: EKOSİSTEM, OYUNLAŞTIRMA & SOSYAL"
- Headline: "Bir Uygulama Değil, Yeni Yaşam Tarzınız" (`text-3xl md:text-5xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`
- Cards: identical styling to Phases 1-3 (`bg-[#0a0a0a]`, radial gradient, GPU classes, neon hover)
- Maps over `ecosystemFeaturesAthletes`

### What stays untouched
- Hero, scroll indicator, Phases 1-3
- Form logic, success state, footer
- All animation variants

