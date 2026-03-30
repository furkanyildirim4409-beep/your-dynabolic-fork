

# Standardize CoachWaitlist Initial Load Animation

## Problem
The `CoachWaitlist` page uses heavy custom `container`/`item` stagger variants (0.2s stagger, 0.4s delay, custom cubic-bezier) applied to every element in the Hero, causing Chromium to batch-animate many GPU-promoted elements simultaneously on mount. Other pages use the simple `AppShell` pattern: a single `motion.main` with `opacity: 0→1, y: 20→0` over 0.3s — no stagger, no variants.

## Changes — `src/pages/CoachWaitlist.tsx`

### 1. Remove `container` and `item` variant objects (lines 106-113)
Delete both variant definitions entirely.

### 2. Replace Hero animation with a single wrapper fade
- Remove `variants={container} initial="hidden" animate="show"` from the Hero `motion.section` (line 207-211).
- Replace with the standard AppShell pattern: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}`.
- Remove all `variants={item}` from child elements inside the Hero (eyebrow, headline, sub-headline, CTA button, scroll indicator). Convert those `motion.*` elements to plain HTML tags (`p`, `h1`, `button`, `div`) where they don't need independent animation. Keep `motion.button` only for the CTA (it uses `whileHover`/`whileTap`) and `motion.div` for the scroll indicator bounce.

### 3. Simplify Top Nav animation
- The `motion.nav` (line 186-189) has its own `initial/animate` which is fine and lightweight. Keep it as-is since it's a single element.

### 4. Bento Grid sections remain untouched
- Phase 1/2/3 grids already use `whileInView` (scroll-triggered), not mount animation. No changes needed — they only animate when scrolled into view, which is already performant.

### 5. Net result
- Mount triggers exactly 2 lightweight animations (nav fade + hero fade) instead of 6+ staggered GPU-promoted element animations.
- All content, layout, CSS, GPU classes, and scroll-triggered Bento animations are preserved.

