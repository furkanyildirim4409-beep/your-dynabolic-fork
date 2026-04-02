

# Fix: Barcode Scanner UI Overlay & Recognition Engine

## Problem
The `html5-qrcode` library renders its own white bounding box and shaded overlay via `qrbox`, conflicting with our custom neon-green CSS overlay. Additionally, `aspectRatio: 1.0` distorts the native camera feed, and the restricted scan area hurts recognition.

## Fix (1 file)

### `src/components/BarcodeCameraScanner.tsx`

**Line 60** — also import `Html5QrcodeSupportedFormats`:
```typescript
const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
```

**Lines 66-88** — replace the `scanner.start()` call: remove `qrbox` and `aspectRatio`, add `formatsToSupport`, bump `fps` to 15:
```typescript
await scanner.start(
  { facingMode: "environment" },
  {
    fps: 15,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
    ],
  },
  (decodedText) => {
    if (hasDetectedRef.current) return;
    hasDetectedRef.current = true;
    if (navigator.vibrate) navigator.vibrate(100);
    stopScanner().then(() => onDetectedRef.current(decodedText));
  },
  () => {}
);
```

**Why this works:**
- Removing `qrbox` eliminates the library's default white box and shaded overlay — our CSS overlay becomes the sole UI.
- Removing `aspectRatio` lets the camera use its native ratio (typically 16:9), filling the viewport naturally.
- `formatsToSupport` restricts the decoder to product barcode formats only, reducing false positives and improving speed.
- `fps: 15` increases scan frequency for faster detection.

No other files need changes.

