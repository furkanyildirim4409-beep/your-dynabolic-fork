

## Plan: Render Highlights in Coach Profile (Epic 3 - Part 3)

### Summary
Create a `useCoachHighlights` hook that fetches permanent categorized stories, and render them as Instagram-style highlight circles in `CoachProfile.tsx`.

### Step 1 -- Add `useCoachHighlights` hook to `src/hooks/useCoachDetail.ts`

New exported interface and hook:

```typescript
export interface CoachHighlight {
  category: string;
  cover_image: string;
  stories: CoachStoryRow[];
}

export function useCoachHighlights(coachId: string | undefined) {
  return useQuery<CoachHighlight[]>({
    queryKey: ["coach-highlights", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, category, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .eq("coach_id", coachId!)
        .not("category", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by category
      const grouped = new Map<string, CoachStoryRow[]>();
      for (const s of (data ?? []) as any[]) {
        const row: CoachStoryRow = {
          id: s.id, coach_id: s.coach_id, media_url: s.media_url,
          expires_at: s.expires_at, created_at: s.created_at,
          coach: { full_name: s.profiles?.full_name ?? "Koç", avatar_url: s.profiles?.avatar_url ?? null },
        };
        const cat = s.category as string;
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(row);
      }

      return Array.from(grouped.entries()).map(([category, stories]) => ({
        category,
        cover_image: stories[0].media_url, // most recent (already sorted)
        stories,
      }));
    },
    staleTime: 300_000,
  });
}
```

### Step 2 -- Render Highlights UI + interactivity in `CoachProfile.tsx`

**Import**: Add `useCoachHighlights, type CoachHighlight` to existing import from `useCoachDetail`.

**Initialize** (after line 54):
```typescript
const { data: highlights, isLoading: highlightsLoading } = useCoachHighlights(coachId);
```

**Add click handler**:
```typescript
const handleHighlightClick = (highlight: CoachHighlight) => {
  const mapped: Story[] = highlight.stories.map((s) => ({
    id: s.id,
    title: highlight.category,
    thumbnail: s.media_url,
    content: { image: s.media_url, text: "" },
  }));
  openStories(mapped, 0, {
    categoryLabel: highlight.category,
    categoryGradient: "from-amber-500 to-orange-500",
  });
};
```

**Render** after the Stories section (after line 251), before Tabs:
```jsx
{(highlightsLoading || (highlights && highlights.length > 0)) && (
  <div className="px-4 pb-4">
    <p className="text-muted-foreground text-xs font-medium mb-2 tracking-wider">ÖNE ÇIKANLAR</p>
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
      {highlightsLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))
      ) : (
        (highlights ?? []).map((h) => (
          <button key={h.category} onClick={() => handleHighlightClick(h)} className="flex flex-col items-center gap-1 flex-shrink-0 group">
            <div className="p-0.5 rounded-full border border-white/20">
              <div className="w-16 h-16 rounded-full bg-muted bg-cover bg-center"
                style={{ backgroundImage: `url(${h.cover_image})` }} />
            </div>
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground max-w-[64px] truncate">{h.category}</span>
          </button>
        ))
      )}
    </div>
  </div>
)}
```

Highlights use a subtle `border-white/20` border (no gradient) to visually distinguish them from active stories which use the gradient ring.

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useCoachDetail.ts` | Add `CoachHighlight` interface + `useCoachHighlights` hook |
| `src/pages/CoachProfile.tsx` | Import hook, add handler, render highlights section |

No database changes needed.

