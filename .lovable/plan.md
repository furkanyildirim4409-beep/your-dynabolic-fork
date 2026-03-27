

## Chat Interface Seamless Glassmorphic Fix

### Root Cause

The header, footer, and input field were already patched in previous hotfixes — they have no `border-b`, `border-t`, or `border-border`. The harsh border you're seeing comes from **line 80**:

```
className="fixed inset-0 z-50 bg-background border-8 border-solid"
```

This `border-8 border-solid` was added in a recent edit and draws a thick 8px border around the entire chat overlay, creating visible harsh lines on all sides including between the header/footer and the edges.

### Fix

**File: `src/components/chat/ChatInterface.tsx` — Line 80**

Remove `border-8 border-solid` from the outer `motion.div`:

```
before: "fixed inset-0 z-50 bg-background border-8 border-solid"
after:  "fixed inset-0 z-50 bg-background"
```

That's the only change needed. Everything else (header, footer, input) is already seamless from the previous hotfixes.

