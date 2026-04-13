

## Plan: Build React Query Hooks for Stories & Leaderboard (Part 4)

### Summary
Create `src/hooks/useDiscoveryData.ts` with two hooks: `useCoachStories` and `useLeaderboardCoaches`. No UI changes.

### Step 1 -- Add `LeaderboardCoach` interface to `src/types/shared-models.ts`

```typescript
export interface LeaderboardCoach {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  students: number;
  score: number;
  level: number;
  hasNewStory: boolean;
}
```

### Step 2 -- Create `src/hooks/useDiscoveryData.ts`

**`useCoachStories()`** -- `useQuery` hook
- Query key: `["coach-stories"]`
- Fetches from `coach_stories` where `expires_at > now()`, ordered by `created_at` desc
- Joins `profiles!coach_id(full_name, avatar_url)` for coach info
- Returns array of `{ id, coach_id, media_url, expires_at, created_at, coach: { full_name, avatar_url } }`
- `staleTime: 60_000`

**`useLeaderboardCoaches()`** -- `useQuery` hook
- Query key: `["leaderboard-coaches"]`
- Fetches from `profiles` where `role = 'coach'`
- Selects: `id, full_name, avatar_url, specialty, level`
- Maps to `LeaderboardCoach` interface with safe fallbacks for missing fields (`rating: 4.9`, `score` derived from level, `students: 0`, `hasNewStory: false`)
- Sorts by `score` descending
- `staleTime: 120_000`

### Files Changed
| File | Action |
|------|--------|
| `src/types/shared-models.ts` | Append `LeaderboardCoach` interface |
| `src/hooks/useDiscoveryData.ts` | New file with both hooks |

No UI files touched. No database changes.

