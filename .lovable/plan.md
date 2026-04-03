

# Plan: Profile Data Binding & Edit Dialog

## Summary
Remove hardcoded mock data from the profile card, bind real DB values, add an Edit Profile dialog, and clean up deprecated UI sections. One migration, one new component, one file edit.

## Database Migration

Add `phone_number` column to `profiles` (the only missing column):
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
```
`avatar_url`, `streak`, `longest_streak` already exist. No `badge_count` column needed — we'll query `athlete_badges` count dynamically.

The `avatars` bucket already exists and is public. No storage changes needed.

## File Changes

### 1. New: `src/components/EditProfileDialog.tsx`

A Dialog (using existing `dialog.tsx` primitives) with:
- **Avatar upload** — click circular avatar preview, select file, upload to `avatars` bucket at `${user.id}/avatar.jpg`, update `profiles.avatar_url`. Reuse the existing crop flow from `AvatarCropperModal`.
- **Full Name** field (text input, bound to `full_name`)
- **Phone Number** field (text input, placeholder "+90 555 123 45 67", bound to `phone_number`)
- Save button calls `supabase.from("profiles").update(...)` then `refreshProfile()`
- Uses existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Input`, `Button`, `Avatar` components

### 2. Modified: `src/pages/Profil.tsx`

**Profile Card (lines 232-246) — Replace hardcoded stats with real data:**
- "847 Antrenman" → query completed workout count via a small `useQuery` or inline fetch from `assigned_workouts` where `status='completed'`
- "156 Gün Serisi" → bind to `profile.streak ?? 0`
- "12 Rozet" → query `athlete_badges` count via `useQuery`
- Add a pencil/edit icon button (top-right of the card) that opens `EditProfileDialog`

**Remove "Toparlanma Bölgeleri" section (lines 469-502):**
- Delete the `recoveryZones` array (lines 110-115) and the entire Recovery Zones motion.div

**Remove "Yeni Fotoğraf Ekle" section (lines 577-619):**
- Delete the entire "YENİ FOTOĞRAF EKLE" card (handled by TransformationTimeline)

**WearableDeviceSync — no change needed:**
- The existing `WearableDeviceSync.tsx` already uses 🍎 for Apple Health and 💚 for Google Health Connect. These are appropriate. No emoji change required.

### 3. New hook or inline queries

For workout count and badge count, use two small `useQuery` calls inside `Profil.tsx`:
```typescript
const { data: workoutCount } = useQuery({
  queryKey: ["completed-workout-count", user?.id],
  queryFn: async () => {
    const { count } = await supabase
      .from("assigned_workouts")
      .select("*", { count: "exact", head: true })
      .eq("athlete_id", user!.id)
      .eq("status", "completed");
    return count ?? 0;
  },
  enabled: !!user,
});

const { data: badgeCount } = useQuery({
  queryKey: ["badge-count", user?.id],
  queryFn: async () => {
    const { count } = await supabase
      .from("athlete_badges")
      .select("*", { count: "exact", head: true })
      .eq("athlete_id", user!.id);
    return count ?? 0;
  },
  enabled: !!user,
});
```

## Visual Impact
- Profile card stats become dynamic (may show 0 for new users — that's correct)
- Two deprecated cards removed → cleaner page
- New edit button + dialog for profile editing
- Zero design/layout changes to remaining components

