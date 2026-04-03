

# Fix: iOS Barcode Scanner — Error Handling & Fallback Chain

## Problems Found During Testing

1. **Error detection is broken**: `html5-qrcode` throws plain **strings** (not Error objects), so `err.name` is always `undefined`. The `NotFoundError`/`NotAllowedError` check never matches, resulting in generic "Bilinmeyen hata" messages.
2. **Last-resort fallback is more restrictive than initial attempt**: `{ facingMode: { exact: "environment" } }` is stricter than `{ facingMode: "environment" }`. On iOS, if the simple version fails, the exact version will definitely fail too. The true last resort should be device enumeration or just `true`.
3. **Missing `disableFlip: true`** in constructor (was planned but not applied).
4. **React ref warning**: `Beslenme.tsx` passes a ref to `BarcodeCameraScanner` but the component isn't wrapped in `forwardRef`.

## Changes (1 file)

### `src/components/BarcodeCameraScanner.tsx`

**Change 1 — Constructor: add `disableFlip: true`** (line 63-71)

Add `disableFlip: true` to prevent library UI injection that breaks CSS layout.

**Change 2 — Fix fallback chain** (lines 88-119)

Replace the last-resort `{ facingMode: { exact: "environment" } }` with a proper fallback:
- First try `{ facingMode: "environment" }` (simple, works on most iOS)
- On Android, also try with `aspectRatio: { ideal: 9/16 }`
- Last resort: enumerate cameras via `Html5Qrcode.getCameras()` and use the back camera's `deviceId` directly — this bypasses `facingMode` constraints entirely, which is the most reliable iOS fallback

**Change 3 — Fix error string parsing** (lines 120-128)

The library throws strings like `"Error getting userMedia, error = NotFoundError: ..."`. Update error handling to:
```typescript
const errStr = String(err?.message || err || "");
const isPermissionOrNotFound = 
  errStr.includes("NotAllowedError") || 
  errStr.includes("NotFoundError") ||
  errStr.includes("Permission") ||
  (err?.name === "NotAllowedError") || 
  (err?.name === "NotFoundError");
```

This catches both proper Error objects and string-wrapped errors from the library.

**Change 4 — Fix React ref warning** (optional, minor)

No action needed in this file — the fix belongs in `Beslenme.tsx` where the ref is passed. Will note for awareness.

## Technical Detail

The camera enumeration fallback is critical for iOS Safari 16+ where `facingMode` constraints can fail silently. By calling `Html5Qrcode.getCameras()` first and selecting the back camera by label (containing "back" or "rear" or "arka"), we can pass the `deviceId` directly to `scanner.start()`, completely bypassing constraint negotiation.

