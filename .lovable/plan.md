
Goal: fix `phone_number` persistence with the smallest possible change in the real auth file.

What I found
- The real file is `src/context/AuthContext.tsx` (singular), not `src/contexts/...`.
- This file does not currently have:
  - an exported `Profile` interface
  - a manual `const profileData: Profile = { ... }` mapper
- Instead, it uses `type Profile = Tables<"profiles">` and `fetchProfile()` returns the raw row from `.select("*")`.
- `phone_number` already exists in generated Supabase types (`src/integrations/supabase/types.ts`).
- `EditProfileDialog.tsx` already:
  - reads `profile.phone_number`
  - updates `phone_number: phoneNumber.trim() || null`
  - awaits `refreshProfile()`
- A migration already exists:
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;`

Plan
1. Update only `src/context/AuthContext.tsx`.
2. Replace the current loose profile alias with an explicit exported `Profile` shape that includes `phone_number: string | null`.
3. Normalize the result inside `fetchProfile()` by building and returning a `Profile` object, explicitly preserving:
   - `id`
   - `email`
   - `full_name`
   - `phone_number`
   - all other currently used profile fields already relied on elsewhere
4. Keep the rest of `AuthContext` untouched:
   - no auth flow changes
   - no listener changes
   - no `refreshProfile()` behavior changes
5. Leave `EditProfileDialog.tsx` functionally unchanged, since its save/refresh logic is already correct.
6. If the environment missed the migration, re-run:
   `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;`

Why this is the right minimal fix
- Your exact snippet does not match the current file structure, but the equivalent fix is to make `fetchProfile()` explicitly carry `phone_number` into the `profile` object stored in context.
- This keeps the change narrowly scoped to AuthContext and directly targets the reload/open-dialog persistence path.

Files involved
- `src/context/AuthContext.tsx` — only file to change
- `src/components/EditProfileDialog.tsx` — verify only, no planned logic change
- `supabase/migrations/20260403143124_7b6476cf-3026-4e21-a537-c677be025d40.sql` — already contains the fallback column addition
