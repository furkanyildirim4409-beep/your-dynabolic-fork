

# Part 1: Replace Phase 1 with "AI Doctor & Otonom Zekâ" (6 Features, 4-col Grid)

## Single file: `src/pages/CoachWaitlist.tsx`

### 1. Update imports (line 3)
Add `Microscope`, `Activity`, `Wand2` to lucide-react imports. Keep all existing icons (needed for Phase 2, 3, form).

### 2. Replace `coreEngineFeatures` array (lines 8-39)
Delete the current 5-feature array. Replace with new 6-feature `aiDoctorFeatures` array using a 4-column grid system:

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 1 | `Microscope` | 2 | AI Destekli Kan Tahlili Analizi |
| 2 | `Activity` | 1 | Otonom Uyum Skoru (Adherence) |
| 3 | `Wand2` | 1 | AI Program Jeneratörü |
| 4 | `Calculator` | 2 | Dinamik Gramaj Matematiği |
| 5 | `RefreshCw` | 2 | AI Destekli Canlı Revizyon |

Note: The user listed 5 features (not 6). We implement exactly the 5 specified, using `lg:col-span` values from the request. Feature 5 gets `lg:col-span-2` as specified.

### 3. Update Phase 1 section header (lines 302-314)
- Eyebrow text: "FAZ 1: AI DOCTOR & OTONOM ZEKÂ"
- Headline: "Sizin İçin Düşünen, Analiz Eden ve Uyaran Bir Asistan"
- Headline sizing: `text-3xl md:text-5xl` (upgraded from md:text-4xl)

### 4. Update Phase 1 grid layout (line 318)
Change from `grid-cols-1 md:grid-cols-3` to `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-[1400px]`.

### 5. Update card className logic (lines 321-334)
Update the dynamic colSpan classes to include both `md:col-span-X` and `lg:col-span-X` from the feature data. Update `bg-white/[0.02]` to `bg-[#0a0a0a]` per the spec.

### 6. Update Phase 1 section container width
Change `max-w-6xl` to `max-w-[1400px]` to accommodate the 4-column layout.

### 7. Scroll indicator target
Keep `id="phase-1"` on the Phase 1 section — no change needed.

### What stays untouched
- Hero section, scroll indicator, nav
- Phase 2 (operations), Phase 3 (finance) — arrays and JSX unchanged
- Trust banner, form, footer
- All animation variants (`heroContainer`, `heroItem`, `container`, `item`)
- GPU acceleration classes on all cards

