

## Plan: Voice Note System (Part 4 of 4 — The Finale)

### Summary

Create a `useAudioRecorder` hook using the MediaRecorder API, then inject a Mic button into both chat interfaces (ChallengeDetailModal duel chat and ChatInterface coach chat). Add audio bubble rendering to the duel chat (already exists in coach chat).

### Technical Details

#### 1. New Hook — `src/hooks/useAudioRecorder.ts`

- Uses `navigator.mediaDevices.getUserMedia({ audio: true })` to capture audio
- Returns `{ isRecording, recordingDuration, startRecording, stopRecording }`
- `startRecording()`: requests mic permission, starts `MediaRecorder`, begins a 1-second interval timer for `recordingDuration`
- `stopRecording()`: returns a `Promise<File>` — stops recorder, collects chunks into a Blob (`audio/webm`), wraps as `File` named `voice_note_${Date.now()}.webm`
- Cleans up streams and interval on unmount

#### 2. `src/components/ChallengeDetailModal.tsx` — Duel Chat

**Imports:** Add `Mic` from lucide-react, import `useAudioRecorder`.

**Audio bubble rendering:** Add `audio` media_type case in the message map (between video and text):
```tsx
{msg.media_url && msg.media_type === "audio" && (
  <audio src={msg.media_url} controls className="max-w-[200px] h-10 mb-1" />
)}
```

**Mic button in input area:** Add between Paperclip and Input:
- If not recording: `<Mic>` icon button, onClick calls `startRecording()`
- If recording: pulsing red `<Mic>` button with `animate-pulse text-destructive`, onClick calls `stopRecording()` then sends the file via `sendMessage({ text: "🎵 Sesli Mesaj", file })`
- When recording, change input placeholder to `Kaydediliyor... (${duration}s)`

#### 3. `src/components/chat/ChatInterface.tsx` — Coach Chat

**Imports:** Add `Mic` from lucide-react, import `useAudioRecorder`.

**Mic button:** Add between Paperclip button and Input:
- Same toggle logic as duel chat
- When recording, update placeholder to show duration
- On stop, call `handleSend` with the audio file

**Audio bubbles:** Already handled (image, video, audio all rendered).

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAudioRecorder.ts` | New — MediaRecorder hook |
| `src/components/ChallengeDetailModal.tsx` | Add Mic button + audio bubbles in duel chat |
| `src/components/chat/ChatInterface.tsx` | Add Mic button in coach chat input |

