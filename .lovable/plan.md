

# Fix: Phone Number Persistence and Type Safety

## Problem
The `phone_number` field works at the database level, but the code uses `as any` casts that mask type issues and make the code fragile. The `phone_number` column already exists in Supabase types (`Tables<"profiles">` includes `phone_number: string | null`), and the fetch uses `.select("*")`, so the data is already being returned — the issue is purely in how the code accesses it.

## Root Cause
In `EditProfileDialog.tsx`:
- Line 31: `(profile as any).phone_number` — unnecessary cast, hides the fact that `profile.phone_number` is valid
- Line 85: `as any` on the update object — unnecessary, `phone_number` is in the Update type

These casts were added when `phone_number` wasn't yet in the generated types. Now that the migration ran and types were regenerated, they should be removed.

## Changes

### File: `src/components/EditProfileDialog.tsx`

1. **Line 31** — Remove `as any` cast:
   ```typescript
   // Before
   setPhoneNumber((profile as any).phone_number || "");
   // After
   setPhoneNumber(profile.phone_number || "");
   ```

2. **Lines 80-86** — Remove `as any` from update call:
   ```typescript
   // Before
   const { error } = await supabase
     .from("profiles")
     .update({
       full_name: fullName.trim() || null,
       phone_number: phoneNumber.trim() || null,
     } as any)
     .eq("id", user.id);
   // After
   const { error } = await supabase
     .from("profiles")
     .update({
       full_name: fullName.trim() || null,
       phone_number: phoneNumber.trim() || null,
     })
     .eq("id", user.id);
   ```

No migration needed — the `phone_number` column already exists and the types already reflect it. No changes to `AuthContext.tsx` — it already uses `.select("*")` with `Tables<"profiles">` as the return type, which includes `phone_number`.

