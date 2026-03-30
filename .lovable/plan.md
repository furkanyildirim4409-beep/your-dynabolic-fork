

# Part 3: Scroll Indicator + Phase 3 (Institutional & Finance)

## Single file edit: `src/pages/CoachWaitlist.tsx`

### 1. Add new imports (line 3)
Add `Wallet`, `UserPlus`, `ShieldCheck`, `FileText`, `Medal` to the lucide-react import.

### 2. Add `financeFeatures` array (after `operationsFeatures`, ~line 72)

| # | Icon | colSpan | Title |
|---|------|---------|-------|
| 11 | `Wallet` | 2 | Ciro & Hak Ediş Merkezi |
| 12 | `UserPlus` | 1 | Asistan & Alt Koç Atama |
| 13 | `ShieldCheck` | 1 | Super Admin Dashboard |
| 14 | `FileText` | 1 | Gelişmiş PDF Raporlama |
| 15 | `Medal` | 1 | Kurumsal Otorite & White-Label |

### 3. Animated Scroll Indicator (inside Hero section, after CTA button ~line 235)

A `motion.div` with:
- `ChevronDown` icon + "Mühendisliği Keşfet" text (neon green, `text-[10px]`, mono, uppercase)
- Floating bounce animation: `animate={{ y: [0, 8, 0] }}` with `repeat: Infinity`
- `onClick` scrolls to `#phase-1`
- Positioned at bottom of hero with `mt-16`

### 4. Add `id="phase-1"` to Phase 1 section (line 239)

Add the anchor ID to the Core Engine `motion.section`.

### 5. Insert Phase 3 JSX section (between Phase 2 closing tag and Trust Banner)

New `motion.section` matching Phase 1/2 styling:
- Eyebrow: "Faz 3: Kurumsallaşma & Finans"
- Headline: "Bir Antrenörden Daha Fazlası Olun"
- Same 3-col grid, same card styling with GPU classes and radial gradient glow
- Same `whileInView` stagger animation

### 6. Everything else untouched
Trust banner, form, footer remain in place. GPU optimizations preserved on all cards.

