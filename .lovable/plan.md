

## Plan: Inject Live Data into Stories & Leaderboard (Part 5)

### Summary
Replace mock data in the Stories Ring and KOÇLAR tab with live hooks from `useDiscoveryData.ts`. MAĞAZA tab untouched.

### Changes to `src/pages/Kesfet.tsx`

**1. Imports (lines 1-19)**
- Add: `import { useCoachStories, useLeaderboardCoaches } from "@/hooks/useDiscoveryData";`
- Remove `getLeaderboardCoaches` from the `@/lib/mockData` import (keep `coaches` for MAĞAZA `getAllProducts`)
- Remove `Coach` type import if only used by `handleStoryClick`

**2. Hook calls (lines 70-74)**
- Add: `const { data: liveStories, isLoading: storiesLoading } = useCoachStories();`
- Add: `const { data: liveLeaderboard, isLoading: leaderboardLoading } = useLeaderboardCoaches();`
- Remove: `const sortedCoaches = getLeaderboardCoaches();` (line 73)

**3. Stories Ring (lines 166-200)**
- Deduplicate `liveStories` by `coach_id` (take first story per coach) to show one avatar per coach
- Loading state: when `storiesLoading`, render 5 skeleton circles (w-16 h-16 rounded-full) with a small text skeleton below
- Replace `coaches.map(...)` with deduplicated live coaches map
- Avatar: `story.coach.avatar_url`, Name: `story.coach.full_name`, fallback text
- `handleStoryClick` updated to accept the live story shape (no longer needs `Coach` type) — open story viewer with `media_url` as the image content

**4. KOÇLAR Tab (lines 317-364)**
- Loading state: when `leaderboardLoading`, render 5 skeleton rows matching the card layout (rank circle + avatar + name/specialty lines + score badge)
- Replace `sortedCoaches.map(...)` with `(liveLeaderboard ?? []).map(...)`
- Fields map directly: `coach.name`, `coach.avatar`, `coach.rating`, `coach.students`, `coach.score`, `coach.specialty`
- Medal/rank logic unchanged (uses `index + 1`)

**5. Cleanup**
- Remove `handleStoryClick(coach: Coach)` function, replace with a version accepting the deduped story row
- If `Coach` type import is no longer needed, remove it

### Files Changed
| File | Action |
|------|--------|
| `src/pages/Kesfet.tsx` | Edit imports, hooks, stories section, leaderboard tab |

No new files. No database changes. MAĞAZA tab untouched.

