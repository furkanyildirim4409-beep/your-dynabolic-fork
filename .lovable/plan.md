

## Plan: The Tribunal & Proof Engine (Part 6 of 6)

### Summary

Add a `disputeChallenge` mutation, wire "Kabul Et" and "İtiraz Et" buttons into the VS tab when both sides have submitted values, and update the Proof tab with instructional text pointing users to the Chat tab.

---

### Technical Details

#### 1. Add `disputeChallenge` mutation (`src/hooks/useChallenges.ts`)

Insert a new mutation before the return block (after line 253):

```typescript
const disputeChallengeMutation = useMutation({
  mutationFn: async (challengeId: string) => {
    const { error } = await supabase
      .from("challenges")
      .update({ status: "disputed" })
      .eq("id", challengeId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
    toast({ title: "İtiraz edildi ⚖️", description: "Koç incelemesi bekleniyor." });
  },
});
```

Add `disputeChallenge: disputeChallengeMutation.mutateAsync` to the return object.

Update the `statusMap` in `mapToChallenge` (around line 76) to include `disputed: "active"` so disputed challenges still render as active in the UI (or add `"disputed"` to the Challenge status type if desired — for MVP, mapping to `"active"` keeps it visible).

#### 2. Wire VS Tab actions (`src/components/ChallengeDetailModal.tsx`)

After the winner banner block (line 219), add a new conditional block:

- Condition: `challenge.status === "active" && (challenge.challengerValue ?? 0) > 0 && (challenge.challengedValue ?? 0) > 0 && !challenge.winnerId`
- Render two buttons:
  1. **"Kabul Et (Maçı Bitir)"** — calls `concludeChallenge` with the winner determined by higher value
  2. **"İtiraz Et (Kanıt İste)"** — calls `disputeChallenge(challenge.id)`

Import `concludeChallenge` and `disputeChallenge` from `useChallenges`.

Update the status badge in the header to handle `"disputed"` status with an orange/amber style showing "İtiraz Edildi".

#### 3. Update Proof Tab text (line 280-290)

Replace the current proof tab content with instructional text:
- "Lütfen antrenman videonu veya ekran görüntünü 'Mesajlar' sekmesinden rakibine gönder."
- "Eğer rakibinin yalan söylediğini düşünüyorsan VS sekmesinden İtiraz Et butonuna bas."
- Remove the non-functional "Fotoğraf Çek" button.

---

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useChallenges.ts` | Add `disputeChallenge` mutation + export |
| `src/components/ChallengeDetailModal.tsx` | Wire conclude/dispute buttons, update proof tab text |

