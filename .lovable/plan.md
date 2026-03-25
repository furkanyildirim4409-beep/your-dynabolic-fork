

## Plan: The Arena UI Overhaul (Part 4 of 6)

### Summary

Three targeted fixes: (1) hide the sticky ranking banner when on the Challenges tab, (2) expand exercise search results from 8 to 100 with a scrollable container, (3) convert `ChallengeDetailModal` from a bottom sheet to a full-screen layout.

---

### Technical Details

#### 1. Fix Banner Overlap (`src/pages/Leaderboard.tsx`, line 233)

Change:
```tsx
{currentUser && currentUserRank > 0 && (
```
To:
```tsx
{activeTab === "leaderboard" && currentUser && currentUserRank > 0 && (
```

#### 2. Fix Exercise Search Limit (`src/components/CreateChallengeModal.tsx`)

**Line 63** — change `.slice(0, 8)` to `.slice(0, 100)`.

**Search results list rendering** — wrap `searchResults.map(...)` in a scrollable container:
```tsx
<div className="max-h-[200px] overflow-y-auto pr-2">
  {searchResults.map((name) => ( ... ))}
</div>
```

#### 3. Full-Screen War Room (`src/components/ChallengeDetailModal.tsx`)

**Outer overlay (line 56-61):** Remove the `onClick={onClose}` from the backdrop div since the modal is now full-screen — closing is handled by the X button only.

**Modal container (line 63-69):** Replace classes:
- From: `absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden`
- To: `fixed inset-0 z-[60] bg-background h-[100dvh] w-full flex flex-col rounded-none`

**Animation:** Change from `y: "100%"` slide-up to a fade+scale entrance for full-screen feel.

**Remove drag handle** if any pill-shaped div exists at the top.

**Content area (line 106):** Change `overflow-y-auto p-4` div to use `flex-1 overflow-y-auto p-4` so it fills remaining space below the fixed header and tabs.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Leaderboard.tsx` | Add `activeTab === "leaderboard"` guard to bottom bar |
| `src/components/CreateChallengeModal.tsx` | Expand search slice to 100, wrap results in scrollable div |
| `src/components/ChallengeDetailModal.tsx` | Convert to full-screen layout with flex column structure |

