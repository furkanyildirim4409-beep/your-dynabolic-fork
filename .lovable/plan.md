

# Fix: Biometric Twin Slider Interactivity

## Diagnosis

The existing code in `BiometricTwin.tsx` is correctly wired: `onValueChange={setSliderValue}`, `max={history.length - 1}`, `step={1}`, and `currentRecord` properly indexes `history[sliderValue[0]]`. The likely issue is:

1. **Stale slider position after data loads**: When `history` loads asynchronously, the slider's `max` changes but the `sliderValue` may exceed the new bounds or not trigger a re-render. There is no `useEffect` to reset slider state when history arrives.
2. **Potential out-of-bounds**: If `sliderValue[0]` exceeds the new `history.length - 1` after a refetch, the clamping in `useMemo` works but the Radix slider thumb position may desync from the actual value.

## Change

### `src/components/athlete-detail/BiometricTwin.tsx`

**Add `useEffect` import** (line 1): add `useEffect` to the React import.

**Add reset effect** (after line 48, the `useState` line):

```tsx
useEffect(() => {
  if (history.length > 0) {
    setSliderValue([0]);
  }
}, [history.length]);
```

This ensures the slider resets to the latest measurement whenever history loads or its length changes, keeping the thumb position and displayed data in sync.

**No other changes needed** — the slider binding, data mapping, labels, and null handling are all already correct.

## Files affected
- **Edit**: `src/components/athlete-detail/BiometricTwin.tsx` (add `useEffect` import + reset effect)

