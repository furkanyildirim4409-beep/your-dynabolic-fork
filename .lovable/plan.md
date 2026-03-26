

## Plan: Audio Player Engine & Bugfix (Part 1 of 2)

### Summary

Fix the `media_type` detection bug that saves voice notes as `'image'`, and create a premium custom audio player component.

### Changes

#### 1. Fix `media_type` bug — two hooks

**`src/hooks/useChallengeChat.ts` (line 103)** and **`src/hooks/useRealtimeChat.ts` (line 182)**

Replace:
```typescript
media_type = file.type.startsWith("video") ? "video" : "image";
```
With:
```typescript
if (file.type.startsWith("video")) {
  media_type = "video";
} else if (file.type.startsWith("audio") || file.name.includes(".webm")) {
  media_type = "audio";
} else {
  media_type = "image";
}
```

#### 2. New component — `src/components/ui/CustomAudioPlayer.tsx`

A premium pill-shaped audio player with:
- Hidden `<audio>` element with `preload="metadata"`
- Circular Play/Pause button using Lucide icons
- Clickable progress bar for seeking
- Time display (current / duration) in `text-[9px]`
- Styled with `bg-background/50 backdrop-blur-sm border-border/50 rounded-full`
- Resets progress on ended

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useChallengeChat.ts` | Fix media_type detection (line 103) |
| `src/hooks/useRealtimeChat.ts` | Fix media_type detection (line 182) |
| `src/components/ui/CustomAudioPlayer.tsx` | New — premium audio player component |

