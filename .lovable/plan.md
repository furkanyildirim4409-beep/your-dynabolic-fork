

## Plan: Filter Discovery Stories by Followed Coaches (Epic 2 - Part 3)

### Summary
Update `useCoachStories` to only return stories from coaches the current user follows, and update the empty state message.

### Step 1 -- Update `src/hooks/useDiscoveryData.ts`

**Import** `useAuth` from `@/context/AuthContext`.

**Rewrite `useCoachStories`** to accept no args but internally:
1. Get `user` from `useAuth()`.
2. In `queryFn`, first fetch followed coach IDs from `user_follows` where `follower_id = user.id`.
3. If no followed coaches, return `[]` immediately.
4. Fetch `coach_stories` with `.in('coach_id', followedIds)` plus the existing `expires_at` filter.
5. Update `queryKey` to `["coach-stories", "followed", userId]` so it refetches when user changes.
6. Set `enabled: !!user` to skip when logged out.

```typescript
export function useCoachStories() {
  const { user } = useAuth();
  return useQuery<CoachStoryRow[]>({
    queryKey: ["coach-stories", "followed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Get followed coach IDs
      const { data: follows, error: fErr } = await (supabase as any)
        .from("user_follows")
        .select("followed_id")
        .eq("follower_id", user!.id);
      if (fErr) throw fErr;
      const followedIds = (follows ?? []).map((f: any) => f.followed_id);
      if (followedIds.length === 0) return [];

      // 2. Fetch stories only from followed coaches
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .in("coach_id", followedIds)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as any[]).map(/* same mapping */);
    },
    staleTime: 60_000,
  });
}
```

### Step 2 -- Update empty state in `src/pages/Kesfet.tsx`

Change line 193 from:
```
"Aktif hikaye yok."
```
to:
```
"Takip ettiğiniz koçların henüz aktif bir hikayesi yok."
```

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useDiscoveryData.ts` | Add auth, filter stories by followed coaches |
| `src/pages/Kesfet.tsx` | Update empty state text |

No database changes. No new files.

