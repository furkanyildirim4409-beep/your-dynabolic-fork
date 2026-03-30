

# Part 4: Polish & Footer

## Changes to `src/pages/CoachWaitlist.tsx`

### 1. Trust Banner
Insert a `motion.div` between the Feature Matrix section (line 240) and the Coach Form section (line 242):
- Muted, centered text block with neon lime accent on "50 Elit Antrenör"
- Text: "Sınırlı Beta Kontenjanı: Sadece 50 Elit Antrenör kabul edilecektir. Erken erişim ve ömür boyu kurucu avantajları için yerinizi ayırtın."
- Styled as `text-sm text-white/40` with the key phrase highlighted in `text-[#CCFF00]/70`
- `whileInView` fade-in animation, `max-w-2xl mx-auto`, `pb-20`

### 2. Footer
Insert after the Coach Form closing `</motion.section>` (line 388), before the closing `</div>`:
- A `<footer>` with top border `border-t border-white/[0.06]`
- Left/center: `© 2026 Dynabolic OS. All Systems Operational.` in `text-xs text-white/20 font-mono`
- Right/below on mobile: `Gizlilik Politikası | Kullanım Koşulları` as `<span>` elements (no real links), `text-xs text-white/15 hover:text-white/40 cursor-pointer`
- Padding: `px-6 md:px-12 py-8`, `max-w-5xl mx-auto`, flex row on desktop, stacked on mobile

### 3. Focus ring polish
All inputs and selects already have `focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30` — confirmed, no changes needed.

### Single file edit
Only `src/pages/CoachWaitlist.tsx` is modified.

