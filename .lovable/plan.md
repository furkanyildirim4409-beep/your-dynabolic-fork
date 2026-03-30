

# Part 3: B2B Capture Form for Coach Waitlist

## Database Migration

Add three columns to the existing `waitlist` table plus an INSERT policy for authenticated users:

```sql
ALTER TABLE public.waitlist
  ADD COLUMN role text NOT NULL DEFAULT 'athlete',
  ADD COLUMN athlete_count text,
  ADD COLUMN specialty text;

CREATE POLICY "Authenticated users can insert into waitlist"
  ON public.waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Code Changes — `src/pages/CoachWaitlist.tsx`

Replace the `#coach-form` anchor div with a full form section:

1. **New imports**: `useState` from React, `supabase` client, `toast` from sonner, `Loader2`/`Mail`/`User`/`Instagram`/`ChevronDown` from lucide-react, plus UI components (`Select`, `Input`, `Label`)

2. **State**: `name`, `email`, `specialty`, `athleteCount`, `instagram`, `isSubmitting`, `submitted`

3. **Form UI** matching the existing dark/neon aesthetic:
   - Eyebrow: "Erken Erişim" + headline "Komuta Merkezine Geçiş"
   - Glassmorphic card (`bg-white/[0.03] border border-white/[0.08]`)
   - 5 fields: Name (input), Email (input), Specialty (native select styled dark), Athlete Count (native select), Instagram (input, optional)
   - Submit button: neon lime, shows "Sisteme Kaydediliyor..." spinner when loading
   - Success state replaces form with confirmation message

4. **handleSubmit logic**:
   - Insert to `waitlist` with `role: 'coach'`, `specialty`, `athlete_count`
   - Handle duplicate email error code `23505` with Turkish toast
   - Loading/success states

5. **Animation**: Same `whileInView` stagger pattern as Feature Matrix section

### Single file edit + one migration
| Resource | Action |
|----------|--------|
| Migration SQL | Add 3 columns + auth INSERT policy |
| `src/pages/CoachWaitlist.tsx` | Add form section at bottom |

