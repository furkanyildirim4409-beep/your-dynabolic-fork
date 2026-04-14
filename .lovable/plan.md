

## Plan: Refactor Profile Avatar as Story Ring (Epic 4 - Final UI Refinement)

### Summary
Make the coach's main avatar clickable to open active stories (Instagram-style), add dynamic ring states, and delete the standalone "HİKAYELER" section.

### Changes to `src/pages/CoachProfile.tsx`

**1. Add local watched state** (after line 48):
```typescript
const [allStoriesWatched, setAllStoriesWatched] = useState(false);
```

**2. Add avatar click handler** (after `handleHighlightClick`):
```typescript
const handleAvatarClick = () => {
  if (stories && stories.length > 0) {
    const allStories: Story[] = stories.map((s) => ({
      id: s.id,
      title: s.coach.full_name,
      thumbnail: s.media_url,
      content: { image: s.media_url, text: "" },
    }));
    openStories(allStories, 0, {
      categoryLabel: coachName,
      categoryGradient: "from-pink-500 via-red-500 to-yellow-500",
    });
    setAllStoriesWatched(true);
  }
};
```

**3. Refactor avatar ring** (lines 168-177):

Derive ring state:
```typescript
const hasActiveStories = !storiesLoading && stories && stories.length > 0;
```

Replace the static gradient wrapper with dynamic classes:
- **Unwatched stories**: `p-1 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500` + `cursor-pointer`
- **All watched**: `p-1 rounded-full border-2 border-muted-foreground/30` + `cursor-pointer`
- **No stories**: No ring wrapper, no cursor change

Wrap in `<button>` with `onClick={handleAvatarClick}` (only interactive when stories exist).

**4. Delete "HİKAYELER" section** (lines 237-266):

Remove the entire `{/* Stories Section */}` block. The "ÖNE ÇIKANLAR" (Highlights) section stays untouched.

### Files Changed
| File | Action |
|------|--------|
| `src/pages/CoachProfile.tsx` | Dynamic avatar ring, click handler, delete stories section |

No new files. No database changes.

