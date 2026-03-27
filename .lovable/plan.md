

## UI Polish & Chat Auto-Scroll — Plan

### 1. Fix Chat Auto-Scroll (`src/components/chat/ChatInterface.tsx`)

The auto-scroll logic already exists (lines 38-46) with `messagesEndRef` and a `useEffect`. The issue is the 100ms timeout is too short — on iOS PWA the DOM may not be fully rendered yet, especially with media-heavy messages.

**Fix:** Add a second, longer delayed scroll (300ms) to catch late renders, and use `scrollTo` with `block: "end"` as a fallback. Also ensure scroll fires reliably when `isOpen` transitions from false to true.

```typescript
useEffect(() => {
  if (isOpen) {
    // Immediate attempt
    setTimeout(scrollToBottom, 100);
    // Delayed attempt for iOS/slow renders
    setTimeout(scrollToBottom, 400);
  }
}, [messages, isOpen]);
```

### 2. Wrap PerformanceRing in Glassmorphic Card (`src/components/PerformanceRing.tsx`)

The `PerformanceRing` component renders a bare `div` with `py-8` — no card container. Wrap the entire return in the standard glassmorphic card used across the dashboard.

**Change:** Wrap the outer `div` (line 56) in a container with the project's glass card classes:

```tsx
<div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
  {/* existing ring content */}
</div>
```

Apply the same wrapper to the loading skeleton (line 48).

### Files Changed
- `src/components/chat/ChatInterface.tsx` — Add redundant delayed scroll for iOS reliability
- `src/components/PerformanceRing.tsx` — Wrap in glassmorphic card container

