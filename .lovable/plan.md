

# Fix: Barcode Scanner Infinite Render Loop

## Root Cause

Line 1191 in `Beslenme.tsx` passes an **inline arrow function** as `onClose`:
```tsx
onClose={() => setShowBarcodeCamera(false)}
```
This creates a new function reference every render. The scanner's `useEffect` (line 108) includes `onClose` in its dependency array, so it **re-fires on every render** — destroying and recreating the camera stream in an infinite loop, causing the flashing.

## Fix (2 files)

### 1. `src/components/BarcodeCameraScanner.tsx`
Decouple the `useEffect` from callback props entirely using refs:

- Store `onDetected` and `onClose` in `useRef` containers, updated via a separate `useEffect`. This way the scanner startup effect never re-runs due to prop changes.
- Change the main `useEffect` dependency array to **`[isOpen]` only**.
- Keep the failure callback completely empty (already correct).
- Remove `stopScanner` from deps (it's already a stable `useCallback` with `[]` deps, but removing it from the effect deps is safer).

```typescript
// Stable refs for callbacks
const onDetectedRef = useRef(onDetected);
const onCloseRef = useRef(onClose);
useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

// Main effect depends ONLY on isOpen
useEffect(() => {
  if (!isOpen) { ... return; }
  // ... startScanner uses onDetectedRef.current / onCloseRef.current
}, [isOpen]);
```

### 2. `src/pages/Beslenme.tsx`
Wrap the `onClose` handler in `useCallback` for good measure (belt-and-suspenders):
```tsx
const closeBarcodeCamera = useCallback(() => setShowBarcodeCamera(false), []);
// ...
<BarcodeCameraScanner onClose={closeBarcodeCamera} ... />
```

This eliminates all unstable dependencies from the scanner effect, guaranteeing a single camera initialization per open.

