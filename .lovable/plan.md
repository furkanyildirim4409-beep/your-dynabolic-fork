

## Plan: Inject Coach-Specific Stories into CoachProfile (Part 5)

### Summary
Add a coach-specific stories hook and render a horizontal story ring on the Coach Profile page, between the action buttons and the tabs.

### Step 1 -- Add `useCoachSpecificStories` hook to `src/hooks/useCoachDetail.ts`

Append a new hook that reuses the `CoachStoryRow` interface from `useDiscoveryData.ts`:

```typescript
import type { CoachStoryRow } from "@/hooks/useDiscoveryData";

export function useCoachSpecificStories(coachId: string | undefined) {
  return useQuery<CoachStoryRow[]>({
    queryKey: ["coach-stories", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .eq("coach_id", coachId!)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((s): CoachStoryRow => ({
        id: s.id, coach_id: s.coach_id, media_url: s.media_url,
        expires_at: s.expires_at, created_at: s.created_at,
        coach: { full_name: s.profiles?.full_name ?? "Koç", avatar_url: s.profiles?.avatar_url ?? null },
      }));
    },
    staleTime: 60_000,
  });
}
```

### Step 2 -- Update `src/pages/CoachProfile.tsx`

**Imports**: Add `useCoachSpecificStories` from `useCoachDetail`, `useStory` from `StoryContext`, `CoachStoryRow` type from `useDiscoveryData`.

**Hook init** (after line 50): `const { data: stories, isLoading: storiesLoading } = useCoachSpecificStories(coachId);` and `const { openStories } = useStory();`

**Story click handler**: Convert `CoachStoryRow` to `Story` shape and call `openStories`:
```typescript
const handleStoryClick = (storyRow: CoachStoryRow) => {
  const story = { id: storyRow.id, title: storyRow.coach.full_name, thumbnail: storyRow.media_url, content: { image: storyRow.media_url, text: "" } };
  openStories([story], 0, { categoryLabel: coachName, categoryGradient: "from-primary to-primary/60" });
};
```

**UI insertion** (after action buttons div, ~line 192, before Tabs): Render a horizontal scroll of story circles. Only render the section if `storiesLoading || (stories && stories.length > 0)`:
- Loading: 3 skeleton circles (`w-16 h-16 rounded-full`)
- Stories: Map each story as a clickable circle with `media_url` as background image, gradient ring border
- Empty: section hidden entirely

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useCoachDetail.ts` | Add `useCoachSpecificStories` hook |
| `src/pages/CoachProfile.tsx` | Import hook + StoryContext, add story section UI |

No database changes. No new files.

