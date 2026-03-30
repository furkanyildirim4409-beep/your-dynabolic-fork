

# Wire Waitlist Form to Supabase

## Status
The `waitlist` table migration was already applied in the previous message (table created with RLS, anon INSERT, authenticated SELECT). No new migration needed.

## Changes

### Update `src/pages/Waitlist.tsx`
- Add `isSubmitting` state
- Import `supabase` client and `toast`
- Replace the dummy `handleSubmit` with a real Supabase `.insert()` call
- Handle duplicate email (unique constraint error code `23505`) with a Turkish error message
- Show "Kaydediliyor..." text + disabled state on button while submitting
- Show success/error toasts via sonner

### Files Changed
| File | Action |
|------|--------|
| `src/pages/Waitlist.tsx` | Edit — wire form to Supabase |

