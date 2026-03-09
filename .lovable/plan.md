

## Fix: Restore Scrolling While Preserving iOS Viewport

### Problem
`overflow: hidden` on `html, body, #root` plus `position: fixed` on `body` kills all scrolling app-wide. The iOS void fix was correct in intent but too aggressive.

### Changes

**1. `src/index.css` (lines 112-134)**

- Keep `overflow: hidden` on `html` and `body` (prevents rubber-banding)
- Remove `overflow: hidden` from `#root` — instead give it `display: flex; flex-direction: column`
- Remove `position: fixed` from `body` (conflicts with internal scroll)
- Add `overflow-y: auto; -webkit-overflow-scrolling: touch` to `#root`

```css
html, body {
  height: 100dvh;
  height: -webkit-fill-available;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background-color: hsl(var(--void-black));
  -webkit-text-size-adjust: 100%;
}

#root {
  height: 100dvh;
  height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

body {
  /* remove position: fixed */
  width: 100%;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  ...existing styles...
}
```

**2. `src/components/AppShell.tsx`**

Move scroll responsibility to the `<motion.main>` element:

```tsx
<div className="relative h-[100dvh] bg-background overflow-hidden flex flex-col">
  <div className="fixed inset-0 grid-pattern pointer-events-none" />
  <div className="relative mx-auto max-w-[430px] flex-1 flex flex-col overflow-hidden">
    <motion.main
      className="flex-1 overflow-y-auto px-4 pt-2 no-scrollbar overscroll-contain"
      style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      /* keep existing animation props */
    >
      {children}
    </motion.main>
    <EliteDock />
  </div>
</div>
```

Key: `flex-1 overflow-y-auto` on main makes it the scroll container while everything else stays fixed.

**3. `src/components/VisionAIExecution.tsx`** — No changes needed. Already uses `fixed inset-0 overflow-hidden touch-none`.

### Summary
- 2 files: `index.css`, `AppShell.tsx`
- Scroll moves from browser body → internal `<main>` element
- iOS viewport fix preserved (html/body remain locked)

