

# Biometric Twin & Time Travel 2.0

## Summary
Replace the broken 3D `RealisticBodyAvatar` and static "Zaman Yolculuğu" section on the Profile page with a single, premium "Iron Man HUD" style 2D card (`BiometricTwin.tsx`). The card features a centered SVG body silhouette surrounded by floating measurement badges, and a date-snapping timeline slider that updates all values from real `body_measurements` history.

## What gets removed
- `src/components/RealisticBodyAvatar.tsx` (3D Canvas/Three.js component) -- delete entirely
- `src/components/DigitalTwinAvatar.tsx` -- delete entirely
- In `Profil.tsx`: the "DİJİTAL İKİZ" section (lines ~344-391) and the "ZAMAN YOLCULUĞU" section (lines ~393-457) are both replaced by a single `<BiometricTwin />` component

## What gets created

### `src/components/athlete-detail/BiometricTwin.tsx`

**Layout (top to bottom):**
1. Header row: "BİYOMETRİK İKİZ" title + pulsing "CANLI" indicator
2. Main area: centered minimalist SVG human silhouette (pure SVG path, no 3D) with 7 floating glassmorphic badges positioned around it:
   - Left side: Sol Kol (arm), Göğüs (chest)
   - Right side: Omuz (shoulder), Boyun (neck)
   - Center-left: Bel (waist)
   - Center-right: Kalça (hips)
   - Bottom: Bacak (thigh), Yağ Oranı (body_fat_pct)
   - Each badge: label + value from the currently selected historical snapshot
   - Badges connect to body via subtle dashed lines or glow hints
3. Bottom: "Zaman Yolculuğu" slider that snaps to discrete historical dates
4. CTA button: "Yeni Olcum Ekle" opens `UpdateMeasurementsModal`

**Data flow:**
- Uses `useBodyMeasurements()` hook (already fetches `history` array sorted by date)
- Slider `max` = `history.length - 1`, each stop = one measurement record
- On slider change, index into `history` array, display that record's values in all badges
- Default position = index 0 (latest measurement)
- Date label below slider shows the `logged_at` date of selected record

**Styling:**
- Dark glassmorphic card (`backdrop-blur-xl bg-card/80 border border-border`)
- Neon lime (`#b2d928` / `text-primary`) accents on active badge borders
- `transform-gpu` on animated elements per performance memory
- Framer Motion for badge entrance animations (staggerChildren: 0.08)

### Changes to `src/pages/Profil.tsx`
- Remove `RealisticBodyAvatar` import and its section (lines ~344-391)
- Remove the "ZAMAN YOLCULUĞU" section (lines ~393-457)
- Remove `timelineValue` state, `waistScale` calculation, and projection math (no longer needed)
- Add `import BiometricTwin from "@/components/athlete-detail/BiometricTwin"`
- Insert `<BiometricTwin />` in place of the removed sections
- Pass `onAddMeasurement={() => setShowMeasurements(true)}` prop

### No database changes needed
The `body_measurements` table already has all required columns: neck, chest, shoulder, waist, hips, arm, thigh, body_fat_pct, muscle_mass_kg, logged_at. No migration required.

### No changes to `UpdateMeasurementsModal.tsx`
It already handles all tape measurement fields and saves to `body_measurements`. The BiometricTwin just opens it via a button click.

## Files affected
- **Create**: `src/components/athlete-detail/BiometricTwin.tsx`
- **Edit**: `src/pages/Profil.tsx` (swap sections, remove dead state)
- **Delete**: `src/components/RealisticBodyAvatar.tsx`
- **Delete**: `src/components/DigitalTwinAvatar.tsx`

