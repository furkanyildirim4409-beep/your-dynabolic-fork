

## Student Ticketing & Report System (Phase 2 - Epic 5)

### Current State
- No `/destek` route or `Destek.tsx` page exists
- No `tickets` table in the database
- The "Yardim & Destek" button in SettingsPanel just shows a demo toast
- `profiles.coach_id` is available for deriving the coach relationship

### Plan

**1. Create `tickets` table via migration**

```sql
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Açık',
  coach_reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Athletes CRUD own tickets
CREATE POLICY "Athletes manage own tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches can view & reply to tickets from their athletes
CREATE POLICY "Coaches can view athlete tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can update athlete tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

-- Team members access
CREATE POLICY "Team members can view tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (is_active_team_member_of(coach_id));

CREATE POLICY "Team members can update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (is_active_team_member_of(coach_id));
```

**2. Create `src/hooks/useTickets.ts`**

React Query hook with:
- `tickets` — fetches all tickets where `user_id = auth.uid()`, ordered by `created_at desc`
- `createTicket(subject, priority, message)` — inserts with `user_id` from auth and `coach_id` from `profile.coach_id`
- Mutation invalidates the query on success

**3. Create `src/pages/Destek.tsx`**

Premium glassmorphic page with two tabs (Shadcn `Tabs`):

- **Tab 1 "Biletlerim"**: Lists tickets as cards showing subject, status badge (Acik=amber, Cevaplanmis=green, Kapali=gray), priority badge, date, and coach reply if present
- **Tab 2 "Yeni Bilet Olustur"**: Form with Subject Select (Beslenme/Antrenman/Sakatlik/Diger), Priority Select (Normal/Yuksek), Message Textarea, and Submit button with loading state
- Empty state when no tickets exist
- Toast feedback on successful creation, auto-switch to "Biletlerim" tab

Styling: Same glassmorphic cards, gradients, and motion animations used throughout the app.

**4. Wire routing in `App.tsx`**

Add `/destek` route pointing to the new page inside `AppPage` + `ProtectedRoute`.

**5. Update SettingsPanel link**

Change the "Yardim & Destek" button from showing a demo toast to navigating to `/destek`.

### Files Changed
| File | Action |
|------|--------|
| Migration | Create `tickets` table + RLS |
| `src/hooks/useTickets.ts` | Create |
| `src/pages/Destek.tsx` | Create |
| `src/App.tsx` | Add route + import |
| `src/components/SettingsPanel.tsx` | Wire navigation |

