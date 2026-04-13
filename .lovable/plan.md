

## Plan: Wire Up Real Follower Count (Epic 2 - Part 3.5)

### Step 1 -- Add `useFollowerCount` hook to `src/hooks/useFollowSystem.ts`

New exported hook using Supabase's `head: true` + `count: 'exact'` pattern:

```typescript
export function useFollowerCount(coachId: string | undefined) {
  return useQuery<number>({
    queryKey: ["follower-count", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("followed_id", coachId!);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
  });
}
```

### Step 2 -- Add count invalidation to `useToggleFollow`

In `onSettled` (line 58-60), add:
```typescript
queryClient.invalidateQueries({ queryKey: ["follower-count", vars.coachId] });
```

### Step 3 -- Wire into `CoachProfile.tsx`

- Import `useFollowerCount` alongside existing follow imports.
- Initialize: `const { data: followerCount } = useFollowerCount(coachId);`
- Replace hardcoded `0` on line 168 with `{followerCount ?? 0}`.

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useFollowSystem.ts` | Add `useFollowerCount`, update `onSettled` |
| `src/pages/CoachProfile.tsx` | Import hook, display live count |

No database changes.

