

## Plan: Arena UI/UX Restoration (Part 1 of 4)

### Root Cause Analysis

**Bug #1 — Missing opponent data:** `ChallengesSection.tsx` line 108 only passes `id`, `title`, `type`, `target`, `deadline`, `wager`, and `status` to the modal. It completely omits `challengerName`, `challengerAvatar`, `challengedName`, `challengedAvatar`, `challengerValue`, `challengedValue`, `winnerId`, `challengerId`, `challengedId`. The profiles query in `useChallenges.ts` is actually fine — the data is available on the `selectedChallenge` object, it's just not forwarded.

**Bug #2 — Plain input:** The `renderValueOrInput` function uses a tiny `Input` element. Needs replacement with a ScorePad.

### Changes

#### 1. Fix Data Pass-Through (`src/components/ChallengesSection.tsx`, line 108)

Pass all challenge fields to the modal. Replace the inline object construction with a full mapping:

```tsx
<ChallengeDetailModal 
  isOpen={!!selectedChallenge} 
  onClose={() => setSelectedChallenge(null)} 
  challenge={selectedChallenge ? {
    id: selectedChallenge.id,
    title: selectedChallenge.exercise || selectedChallenge.type,
    type: selectedChallenge.type,
    target: String(selectedChallenge.targetValue),
    deadline: selectedChallenge.deadline,
    wager: selectedChallenge.bioCoinsReward,
    status: selectedChallenge.status === "disputed" ? "disputed" : 
            selectedChallenge.status === "active" ? "active" : 
            selectedChallenge.status === "completed" ? "completed" : "pending",
    challengerId: selectedChallenge.challengerId,
    challengerName: selectedChallenge.challengerName,
    challengerAvatar: selectedChallenge.challengerAvatar,
    challengerValue: selectedChallenge.challengerValue,
    challengedId: selectedChallenge.challengedId,
    challengedName: selectedChallenge.challengedName,
    challengedAvatar: selectedChallenge.challengedAvatar,
    challengedValue: selectedChallenge.challengedValue,
    winnerId: selectedChallenge.winnerId,
  } : undefined} 
/>
```

No changes needed to `useChallenges.ts` — the separate profiles query + `mapToChallenge` already populates names/avatars correctly.

#### 2. Overhaul VS Tab — ScorePad UI (`src/components/ChallengeDetailModal.tsx`)

Replace the `renderValueOrInput` function with a ScorePad component:

- **When value already submitted:** Show locked value with a green checkmark badge and large bold typography.
- **When it's the user's turn (active, no value yet):**
  - Large numeric display (text-5xl font-display) showing current `myResult` value (default 0).
  - Quick-adjust button row: `[-10] [-1] [+1] [+10]` as pill buttons with glass-morphism styling.
  - Massive gradient submit button: `bg-gradient-to-r from-primary to-orange-500` with `h-14 text-lg font-bold` and hover scale effect.
  - Button text: "⚔️ SONUCU KAYDET"
- **When it's the opponent's side:** Show their value or "Bekleniyor..." if 0.

**Avatar upgrades:**
- Size: `w-20 h-20` (already done).
- Rings: Current user gets `ring-4 ring-primary/50`, opponent gets `ring-4 ring-destructive/50`.
- Names in `font-display text-sm font-bold`.

### Files Changed

| File | Change |
|------|--------|
| `src/components/ChallengesSection.tsx` | Pass all challenge fields to modal |
| `src/components/ChallengeDetailModal.tsx` | ScorePad UI with quick-adjust buttons, gradient submit, enhanced avatars |

