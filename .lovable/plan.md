

## Upgrade Exercise Image Renderer in Vision AI

Single file change in `src/components/VisionAIExecution.tsx`, line 679.

### Replace the `<img>` tag (line 679)

**From:**
```jsx
<img src={exercise.videoUrl} alt={exercise.name} className="w-full h-full object-cover" loading="eager" />
```

**To:**
```jsx
<img
  src={exercise.videoUrl}
  alt={exercise.name}
  className="w-full h-full object-contain opacity-80 mix-blend-screen"
  loading="lazy"
  decoding="async"
  crossOrigin="anonymous"
  onError={(e) => {
    const img = e.currentTarget as HTMLImageElement;
    img.src = '/placeholder.svg';
    img.className = 'w-1/2 h-1/2 mx-auto my-auto opacity-40 object-contain';
  }}
/>
```

**What changes:**
- `loading="lazy"` — defers off-screen GIF loading
- `decoding="async"` — prevents main thread freeze during heavy GIF decode
- `crossOrigin="anonymous"` — avoids CORS blocks in iOS standalone PWA WebView
- `onError` fallback — gracefully shows placeholder if API key expires or network drops
- `object-contain` + `opacity-80` + `mix-blend-screen` — better visual integration with the dark overlay UI

