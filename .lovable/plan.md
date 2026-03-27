

## Plan: Gladiator's Stats - Profile UI Upgrade (Epic 3 - Part 3)

### What We're Building
A premium glassmorphic stats grid placed directly after the User ID Card header, showing Height, Current Weight, Target Weight (with remaining kg), and Fitness Goal — all pulled from the `profiles` table.

### Implementation

**Single file change: `src/pages/Profil.tsx`**

1. **Add imports**: `Scale, Flame, Dumbbell` from lucide-react; `Progress` from ui/progress; `Skeleton` from ui/skeleton.

2. **Add goal translation map** (above the component):
```
muscle_gain → "Kas Geliştirme"
fat_loss → "Yağ Yakımı"  
strength → "Güç Kazanımı"
endurance → "Dayanıklılık"
general_fitness → "Genel Fitness"
default → "Belirtilmedi"
```

3. **Insert a new stats grid section** between the User ID Card (line ~223) and the Digital Twin section (line ~226). Four glassmorphic cards in a `grid-cols-2 gap-3`:

   - **Boy (Height)**: Ruler icon, `profile.height_cm` or "--", unit "cm"
   - **Mevcut Kilo**: Scale icon, `profile.current_weight` or "--", unit "kg"
   - **Hedef Kilo**: Target icon, `profile.target_weight` or "--", unit "kg". If both weights exist, show a small "Kalan: X kg" badge below
   - **Ana Hedef**: Dumbbell icon, translated `profile.fitness_goal`

4. **Skeleton loading**: When `!profile`, render 4 skeleton cards (same grid) with `Skeleton` component.

5. **Card design**: Each card uses `bg-secondary/30 backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 text-center` with the icon in the accent color, value in `font-display text-xl`, and label in `text-muted-foreground text-[10px] uppercase`.

6. **Access profile fields directly** — `height_cm`, `current_weight`, `target_weight`, `fitness_goal` all exist on the profiles type. Remove the `profileAny` cast workaround for `height_cm` since it's typed.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Profil.tsx` | Add gladiator stats grid after User ID Card header |

