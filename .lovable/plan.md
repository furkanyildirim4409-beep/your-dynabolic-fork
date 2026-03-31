

# Part 1: Athlete Waitlist — "Yeni Nesil Analiz & AI" Bento Grid

## Single file: `src/pages/Waitlist.tsx`

### 1. Update imports (line 3)
Add `ScanLine`, `Activity`, `Microscope`, `Calculator`, `Target` to lucide-react. Keep existing `User`, `Mail`, `Instagram`, `ChevronDown`, `Rocket`, `Loader2`.

### 2. Add feature data array (after line 14)
New `analysisFeaturesAthletes` array with 6 cards:

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `ScanLine` | `md:col-span-2 lg:col-span-2` | AI Beslenme Tarayıcı (NutriScanner) |
| 2 | `User` | `md:col-span-1 lg:col-span-1` | 3D Dijital İkiz (Avatar) |
| 3 | `Activity` | `md:col-span-1 lg:col-span-1` | Vision AI Form Analizi |
| 4 | `Microscope` | `md:col-span-2 lg:col-span-2` | AI Doktor & Kan Tahlili |
| 5 | `Calculator` | `md:col-span-1 lg:col-span-1` | Dinamik Gramaj Motoru |
| 6 | `Target` | `md:col-span-1 lg:col-span-1` | Otonom Uyum Algoritması |

Full descriptions from the spec included.

### 3. Restructure page layout (lines 57-264)
Change from `flex items-center justify-center` centered layout to a full-page scrollable layout:
- Outer: `relative min-h-[100dvh] w-full bg-black overflow-x-hidden` (remove `flex items-center justify-center`)
- Hero becomes its own centered section with `min-h-[100dvh] flex flex-col items-center justify-center`
- Add scroll indicator at bottom of hero: animated ChevronDown with "Süper Güçlerini Keşfet" text, scrolls to `#phase-1`

### 4. Insert Phase 1 section (after hero, before form)
- `motion.section` with `id="phase-1"`, `whileInView` stagger animation
- Container: `max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 pb-32`
- Eyebrow: "FAZ 1: YENİ NESİL ANALİZ & AI"
- Headline: "Sizin İçin Düşünen Dijital İkiziniz" (`text-3xl md:text-5xl`)
- Grid: `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6`
- Cards: identical to CoachWaitlist (`bg-[#0a0a0a]`, radial gradient, GPU classes, neon hover)

### 5. Move form section below Phase 1
- Wrap form in its own `max-w-md mx-auto px-6 py-24` container
- Keep all form logic and success state unchanged
- Footer stays at the bottom

### What stays untouched
- Form logic (`handleSubmit`, state, Supabase insert)
- Animation variants (`container`, `item`)
- Grid background and radial glow
- Logo SVG animation

