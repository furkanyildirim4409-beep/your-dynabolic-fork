

## Plan: Audio Player Integration (Part 2 of 2)

Replace default `<audio controls>` with `CustomAudioPlayer` in both chat interfaces.

### Changes

#### 1. `src/components/chat/ChatInterface.tsx`
- Add import: `import { CustomAudioPlayer } from "@/components/ui/CustomAudioPlayer";`
- Replace lines 186-193 (the `<audio controls>` block) with:
```tsx
{message.media_type === "audio" && message.media_url && (
  <div className="mb-1.5">
    <CustomAudioPlayer src={message.media_url} />
  </div>
)}
```

#### 2. `src/components/ChallengeDetailModal.tsx`
- Add import: `import { CustomAudioPlayer } from "@/components/ui/CustomAudioPlayer";`
- Replace lines 319-321 (the `<audio>` block) with:
```tsx
{msg.media_url && msg.media_type === "audio" && (
  <div className="mb-1">
    <CustomAudioPlayer src={msg.media_url} />
  </div>
)}
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/chat/ChatInterface.tsx` | Import + replace audio element (lines 186-193) |
| `src/components/ChallengeDetailModal.tsx` | Import + replace audio element (lines 319-321) |

