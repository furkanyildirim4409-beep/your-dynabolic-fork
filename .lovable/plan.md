

# Nutrition Epic 4B: Real Camera Barcode Scanner

## Summary
Replace the mock barcode scanner in Beslenme.tsx with a real camera-based barcode reader using `html5-qrcode`, then route detected barcodes through the existing `searchFood(query, barcode)` pipeline to OpenFoodFacts.

## Changes

### 1. Install `html5-qrcode`
Add the npm package — it supports EAN-13, EAN-8, UPC-A, and works well in mobile browsers.

### 2. Create `src/components/BarcodeCameraScanner.tsx`
A full-screen modal component that:
- Uses `Html5Qrcode` to start a rear camera (`facingMode: "environment"`) stream inside a container div
- Shows a dark overlay with a neon-green (`#CCFF00`) cornered scanning box (matching the app's existing primary color language)
- On successful decode: stops the scanner, fires haptic feedback (`navigator.vibrate([100])`), and calls `onDetected(barcodeString)`
- Close button stops camera and unmounts cleanly via `useEffect` cleanup
- Handles `NotAllowedError` / `NotFoundError` — shows a toast: "Kamera izni verilmedi veya kamera bulunamadı."
- All camera resources released in the cleanup to prevent battery drain

### 3. Update `src/pages/Beslenme.tsx`
- Import the new `BarcodeCameraScanner` component
- Modify `openBarcodeScanner` to set a new `showBarcodeCamera` state (separate from the existing `showCamera` used for meal scanning)
- On barcode detection callback:
  1. Close the scanner modal
  2. Call `searchFood("", detectedBarcode)` to trigger the OFF barcode lookup
  3. Open the manual-add dialog (`setShowManualAdd(true)`) so results appear immediately
- The existing mock `CameraScanner` component continues to handle `mode === "meal"` (NutriScan AI) unchanged

### 4. No backend changes
The `search-food` edge function already handles `{ barcode: "..." }` payloads via the OFF V2 API.

