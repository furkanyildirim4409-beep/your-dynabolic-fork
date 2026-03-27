

## Plan: Gladiator Onboarding Wizard (Epic 3, Part 1)

### Current State
- A `BodyMetricsOnboarding` overlay already exists in `AppShell.tsx`, gated on missing `current_weight` or `height_cm`
- The `profiles` table already has: `height_cm`, `current_weight`, `gender`, `activity_level`, `fitness_goal`
- Missing columns: `onboarding_completed`, `target_weight`

### Changes

#### 1. Database Migration
Add two columns to `profiles`:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_weight numeric;
```

#### 2. Create `src/pages/Onboarding.tsx`
Full-screen, glassmorphic 4-step wizard with Framer Motion slide transitions:

- **Step 0 — Welcome**: "Arenaya Hoş Geldin" hero with subtitle and "Başla" CTA
- **Step 1 — Body Stats**: Height (cm), Current Weight (kg), Target Weight (kg) inputs
- **Step 2 — Fitness Goal**: Selectable card grid — "Kas Geliştirme" (muscle_gain), "Yağ Yakımı" (fat_loss), "Güç Kazanımı" (strength)
- **Step 3 — Activity Level**: Reuse the existing activity level cards from `BodyMetricsOnboarding`

On final save: updates `profiles` with all collected data + `onboarding_completed = true`, calls `refreshProfile()`, navigates to `/`.

Progress dots + back/next navigation identical to existing `BodyMetricsOnboarding` styling.

#### 3. Update `src/components/ProtectedRoute.tsx`
Add onboarding redirect logic:
- If user is authenticated, profile loaded, role is `athlete`, and `onboarding_completed` is falsy → redirect to `/onboarding`
- Skip this check if already on `/onboarding` (prevent infinite loop) by accepting an optional `skipOnboardingCheck` prop

#### 4. Update `src/App.tsx`
- Add route: `<Route path="/onboarding" element={<P skipOnboardingCheck><Onboarding /></P>} />`
- Import `Onboarding` page

#### 5. Remove legacy onboarding from `AppShell.tsx`
- Remove the `needsOnboarding` check and `<BodyMetricsOnboarding />` overlay since the new dedicated page replaces it

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Add `onboarding_completed`, `target_weight` to profiles |
| `src/pages/Onboarding.tsx` | New 4-step wizard page |
| `src/components/ProtectedRoute.tsx` | Add onboarding redirect guard |
| `src/App.tsx` | Add `/onboarding` route |
| `src/components/AppShell.tsx` | Remove legacy `BodyMetricsOnboarding` overlay |

