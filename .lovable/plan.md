

# Dynabolic Waitlist Landing Page

## Overview
A standalone, public, full-screen waitlist page at `/waitlist` — ultra-premium dark aesthetic with neon lime (#CCFF00) accents matching the existing Dynabolic brand. Mobile-first, no auth required.

## What Gets Built

### 1. New Page: `src/pages/Waitlist.tsx`
- Full-screen black background with subtle radial neon green glow
- Animated Dynabolic logo (reuse the SVG from SplashScreen with glow effect)
- Bold headline: "DYNABOLIC | Ozel Beta On Kayit" with text-glow
- Sub-headline paragraph
- **Form fields** (UI-only, no backend wiring yet):
  - Name input (User icon)
  - Email input (Mail icon)
  - Goal select dropdown (3 Turkish options)
  - Instagram handle input (Instagram icon, optional)
- Neon green CTA button "Bekleme Listesine Katil" with pulse/glow hover animation
- Particle/grid background effect using CSS for the matrix vibe
- Framer Motion entrance animations on all sections

### 2. Route Registration in `src/App.tsx`
- Add `/waitlist` as a **public route** (no ProtectedRoute wrapper), placed alongside `/login`

## Technical Details

- **Styling**: Tailwind utilities + custom CSS glow classes already in the design system. Brand color `#CCFF00` / `hsl(68 100% 50%)` from existing CSS variables.
- **Icons**: `User`, `Mail`, `Instagram` from `lucide-react`
- **Animations**: `framer-motion` (already installed) for staggered fade-in
- **Responsive**: `max-w-md mx-auto px-6` container, mobile-first sizing
- **No new dependencies required**

## Files Changed
| File | Action |
|------|--------|
| `src/pages/Waitlist.tsx` | Create — full landing page component |
| `src/App.tsx` | Edit — add public `/waitlist` route |

