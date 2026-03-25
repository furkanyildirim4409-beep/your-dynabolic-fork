

## Plan: The War Room Engine (Part 5 of 6)

### Summary

Create `challenge_messages` table with FK to profiles, build a realtime chat hook, add a result submission mutation, and wire both into the ChallengeDetailModal.

---

### 1. Database Migration — `challenge_messages`

New migration file with FK to both `challenges` and `profiles`:

```sql
CREATE TABLE IF NOT EXISTS public.challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.challenge_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_messages.challenge_id
      AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages" ON public.challenge_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_messages.challenge_id
      AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
    )
  );
```

### 2. New Hook — `src/hooks/useChallengeChat.ts`

- `useQuery` fetches `challenge_messages` ordered by `created_at` asc, selecting `*, profiles(full_name, avatar_url)` via the FK join.
- `useEffect` subscribes to Supabase Realtime `postgres_changes` (INSERT on `challenge_messages` filtered by `challenge_id`), invalidating the query on new messages.
- `sendMessage` mutation inserts `{ challenge_id, user_id, message }`.
- Returns `{ messages, sendMessage, isLoading }`.

### 3. Add `submitResult` to `src/hooks/useChallenges.ts`

New mutation after `concludeChallengeMutation` (before the return block, line ~239):

```typescript
const submitResultMutation = useMutation({
  mutationFn: async ({ challengeId, value, isChallenger }: { challengeId: string; value: number; isChallenger: boolean }) => {
    const field = isChallenger ? "challenger_value" : "opponent_value";
    const { error } = await supabase
      .from("challenges")
      .update({ [field]: value })
      .eq("id", challengeId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
    toast({ title: "Sonuç kaydedildi! 💪" });
  },
});
```

Add `submitResult: submitResultMutation.mutateAsync` to the return object.

### 4. Wire UI — `src/components/ChallengeDetailModal.tsx`

**Imports:** Add `useRef, useEffect` from React, `Input` from ui, `useChallengeChat` hook.

**State:** Add `const [myResult, setMyResult] = useState("")` and `const messagesEndRef = useRef<HTMLDivElement>(null)`.

**VS Tab — Result Submission:**
- Determine role: `const isChallenger = challenge.challengerId === "current"`.
- Under each avatar column, if it's the current user's side AND `challenge.status === "active"`:
  - If value is already > 0, show locked value.
  - Otherwise, render `<Input type="number" />` + "Sonucu Kaydet" button calling `submitResult`.

**Chat Tab — Real-time Messaging:**
- Call `useChallengeChat(challenge.id)` at hook level.
- Replace empty state with conditional: show messages list when `messages.length > 0`, empty state otherwise.
- Messages rendered as bubbles: current user right-aligned with `bg-primary text-primary-foreground`, opponent left-aligned with `bg-secondary`.
- Show sender name + timestamp on each bubble.
- `useEffect` scrolls `messagesEndRef` into view when messages change.
- Chat tab uses flex layout: scrollable messages area (`flex-1 overflow-y-auto`) + sticky input bar at bottom (outside scroll area). The parent content div switches to flex-col for the chat tab.

---

### Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/..._challenge_messages.sql` | Create table + RLS with FK to profiles |
| `src/hooks/useChallengeChat.ts` | New — realtime chat hook |
| `src/hooks/useChallenges.ts` | Add `submitResult` mutation + export |
| `src/components/ChallengeDetailModal.tsx` | Wire result submission + live chat UI |

