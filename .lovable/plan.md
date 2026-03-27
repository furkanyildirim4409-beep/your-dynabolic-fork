

## Chat Auto-Scroll & PerformanceRing Widget Hotfix

### 1. Bulletproof Chat Scroll (`src/components/chat/ChatInterface.tsx`)

**Lines 38-47** — Replace scroll logic:

```typescript
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
};

useEffect(() => {
  if (isOpen) {
    scrollToBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
      setTimeout(scrollToBottom, 300);
    });
  }
}, [messages, isOpen]);
```

Also ensure the anchor div at the bottom of the messages list has physical size: change `<div ref={messagesEndRef} />` to `<div ref={messagesEndRef} className="h-1 w-full flex-shrink-0" />`.

### 2. PerformanceRing Widget Visibility (`src/components/PerformanceRing.tsx`)

**Lines 49 and 58** — Replace wrapper classes on both the loading skeleton and main return:

```
bg-white/[0.02] border border-white/[0.05]
```
becomes:
```
bg-card border border-border shadow-lg
```

Final class string: `rounded-2xl bg-card border border-border shadow-lg p-6 relative overflow-hidden`

### Files Changed
- `src/components/chat/ChatInterface.tsx` — `requestAnimationFrame` triple-fire scroll + sized anchor
- `src/components/PerformanceRing.tsx` — Stronger card styling on wrapper

