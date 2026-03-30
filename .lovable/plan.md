

# Part 2: Feature Matrix — Bento Grid

## What we build
A "Bento Box" feature grid section below the Hero in `CoachWaitlist.tsx`. Four glassmorphic cards with icons, titles, and descriptions. Scroll-triggered stagger animation via Framer Motion `whileInView`.

## Changes to `src/pages/CoachWaitlist.tsx`

1. **Import** `Zap`, `Gauge`, `Target`, `Users` from `lucide-react`

2. **Add a features data array** with 4 entries (icon, title, description) matching the spec

3. **Insert a new `<section>`** between the Hero closing tag (line 124) and the `#coach-form` div (line 127):
   - Section title: "Neden Dynabolic?" eyebrow + "Koçlar İçin İnşa Edildi." headline
   - A `grid grid-cols-1 md:grid-cols-2 gap-5` container
   - Each card: `bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8` with `hover:border-[#CCFF00]/30 transition-colors`
   - Icon in a small neon-bordered circle, then title (`text-lg font-semibold text-white`), then description (`text-sm text-white/50`)

4. **Animation**: The grid container uses `motion.div` with `whileInView="show" initial="hidden" viewport={{ once: true, amount: 0.2 }}` and the same stagger container variant. Each card uses the existing `item` variant.

5. **Spacing**: `px-6 md:px-12 pb-32 max-w-5xl mx-auto`

### Card content
| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | Zap | Dinamik Gramaj Motoru | Sporcun 100g yulaf yerine 150g mı yedi? Sistem anında 1.5x çarpanı uygular... |
| 2 | Gauge | Sıfır Gecikme (SWR Cache) | Loading ekranlarına son. SWR mimarimiz sayesinde... |
| 3 | Target | Otonom Uyum Skoru | Kim diyeti bozdu, kim antrenmanı astı?... |
| 4 | Users | Merkezi İstihbarat | Beslenme takvimi, makro hedefleri, su tüketimi... |

### Single file edit
Only `src/pages/CoachWaitlist.tsx` is modified.

