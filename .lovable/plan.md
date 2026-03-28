

## Add Thumbnails to Exercise List Sheet (Phase 3 - Epic 7 - Part 1.6)

### Summary
Replace the status icon container in the "Tüm Hareketler" sheet with exercise GIF thumbnails, falling back to the current icon-based display when no video URL exists.

### Changes

**`src/components/VisionAIExecution.tsx` — Lines 927-931**

Replace the current `w-10 h-10` icon container with a `w-14 h-14` thumbnail container:

- If `ex.videoUrl` exists, render `<img src={ex.videoUrl} loading="lazy" decoding="async" crossOrigin="anonymous" className="w-full h-full object-contain" />` with an inline `onError` that hides the image (swap to fallback icon via local state per-item, or simply set the img `style.display='none'` and show sibling icon)
- Fallback: show `Check` icon (if done) or `Dumbbell` icon (if current/pending) — same as current behavior
- Container styling: `w-14 h-14 rounded-lg overflow-hidden bg-black/40 border border-border/50 shrink-0 flex items-center justify-center`

Since managing per-item error state inside a `.map()` is verbose, extract a small inline approach: render both the `<img>` and a fallback icon, hide the fallback when img loads successfully using CSS (`peer` pattern) or a simple `onError` that swaps `src` to empty and shows the icon.

Cleanest approach: create a tiny `ExerciseThumb` helper component (defined above the return or inline) with its own `useState` for `imgError`.

### Files Changed
| File | Action |
|------|--------|
| `src/components/VisionAIExecution.tsx` | Add thumbnails to exercise list sheet items |

