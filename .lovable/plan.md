

## Plan: Fix Auth Trigger for Email & User Roles (Hotfix)

### Problem
New user registration leaves `profiles.email` as NULL and does not insert a record into `user_roles`, breaking coach panel visibility and role-based logic.

### Solution: Single Database Migration

One migration that:

1. **Rewrites `handle_new_user()` trigger function** to:
   - Insert `new.email` into `profiles.email`
   - Default role to `'athlete'` (not `'coach'`)
   - Use `COALESCE(full_name, split_part(email, '@', 1))` as fallback name
   - Insert into `user_roles` with proper `::app_role` cast
   - Use `ON CONFLICT` for idempotency on both tables

2. **Re-creates the trigger** on `auth.users` (DROP + CREATE) to ensure it points to the updated function

3. **Patches existing data**:
   - Updates NULL emails in `profiles` from `auth.users`
   - Inserts missing `user_roles` records for existing profiles

### Key Detail: Type Cast
The `user_roles.role` column uses the `app_role` enum (`admin`, `coach`, `athlete`). The trigger must cast the text value: `assigned_role::app_role`.

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role text;
BEGIN
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'athlete');

  INSERT INTO public.profiles (id, full_name, avatar_url, role, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = CASE WHEN public.profiles.role IS NULL THEN EXCLUDED.role ELSE public.profiles.role END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Patch existing profiles with missing email
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Patch existing profiles missing from user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, COALESCE(role, 'athlete')::app_role
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Files Changed
| File | Action |
|------|--------|
| Migration SQL | Rewrite trigger, recreate on auth.users, patch data |

No application code changes needed. The `types.ts` file will auto-regenerate after migration.

