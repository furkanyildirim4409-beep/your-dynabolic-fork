

# Upgrade Athlete Hero Section — Premium Cinematic Experience

## Single file: `src/pages/Waitlist.tsx`

### What changes

**Replace lines 243-328** (the entire HERO section) with a new cinematic hero while keeping the `min-h-[100dvh]` wrapper, grid overlay, and radial glow (lines 223-241) untouched.

### New Hero structure

1. **Slower cinematic stagger** — new `heroContainer` / `heroItem` variants with `staggerChildren: 0.2`, `delayChildren: 0.4`, `duration: 0.7` for a deliberate Apple-style entrance.

2. **Animated radial glow** — a dedicated `motion.div` inside the hero that fades from `opacity: 0` to `opacity: 1` over 1s with a large neon-lime radial gradient centered behind the headline.

3. **Subtle particle/node field** — 12-15 small circles (`w-1 h-1` to `w-2 h-2`, `bg-[#CCFF00]/20`) scattered with randomized `framer-motion` float animations (translateY ±20px, opacity 0.1-0.4, duration 3-6s, infinite). Wrapped in a `pointer-events-none absolute inset-0 overflow-hidden` container.

4. **Content stack (centered, max-w-3xl)**:
   - **Logo SVG** — keep existing animated D + lightning bolt, unchanged.
   - **Eyebrow**: `"Sınırlı Beta Kontenjanı"` — `text-xs font-mono tracking-[0.3em] uppercase text-[#CCFF00]`.
   - **Main Headline**: `"WhatsApp'ı Kapatın. Excel'i Çöpe Atın."` — `text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white` with `textShadow` neon glow.
   - **Subheadline**: The provided Turkish copy with `[Yapay Zeka, Otonom Revize, Kan Analizi]` highlighted in `text-[#CCFF00]`. `text-base md:text-lg text-white/60 max-w-xl leading-relaxed`.
   - **CTA Button**: `"Süper Güçlerini Keşfet"` — styled with `bg-[#CCFF00] text-black font-semibold rounded-full px-8 py-4` plus a pulsing `box-shadow` animation (`animate-pulse-glow` using existing keyframe, applied to a wrapping glow ring via `shadow-[0_0_30px_hsla(68,100%,50%,0.5)]`). `onClick` smooth-scrolls to `#phase-1`.
   - **Scroll indicator** — existing bouncing `ChevronDown` with "Mühendisliği Keşfet" label, preserved.

5. **Each element wrapped in `motion.div variants={heroItem}`** for the staggered cinematic entrance.

### What stays untouched
- Grid overlay & radial glow backgrounds (lines 223-241)
- All four Phase sections (Faz 1-4)
- Form logic, success state, footer
- All feature data arrays

### Technical notes
- No new dependencies; uses existing `framer-motion` and `lucide-react`
- Particle nodes generated via a small inline array mapped with randomized positions/delays
- The `heroContainer`/`heroItem` variants defined alongside existing `container`/`item` at the top of the file

