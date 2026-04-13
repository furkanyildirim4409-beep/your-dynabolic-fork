

## Plan: Wire Up Follow Button in CoachProfile (Epic 2 - Part 2)

### Changes to `src/pages/CoachProfile.tsx`

**1. Imports**: Add `useFollowStatus, useToggleFollow` from `@/hooks/useFollowSystem`. Remove nothing (no mock follow imports exist).

**2. Remove mock state** (line 57): Delete `const [isFollowing, setIsFollowing] = useState(false);`

**3. Add live hooks** (after existing hook inits, ~line 55):
```typescript
const { data: isFollowing, isLoading: isFollowLoading } = useFollowStatus(coachId);
const toggleFollow = useToggleFollow();
```

**4. Rewrite `handleFollow`** (~line 79): Replace the `setIsFollowing` + toast with:
```typescript
const handleFollow = () => {
  if (!coachId) return;
  toggleFollow.mutate(
    { coachId, isCurrentlyFollowing: !!isFollowing },
    {
      onSuccess: () => toast(isFollowing ? "Takipten Çıkıldı" : "Takip Edildi!"),
      onError: () => toast.error("Bir hata oluştu."),
    }
  );
};
```

**5. Update button JSX** (~line 156): Add `disabled={isFollowLoading || toggleFollow.isPending}` and ensure label uses `!!isFollowing`.

### Files Changed
| File | Action |
|------|--------|
| `src/pages/CoachProfile.tsx` | Wire live follow hooks, remove mock state |

No database changes. No new files.

