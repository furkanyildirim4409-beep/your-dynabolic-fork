

# Fix: Phone Number Input Population in Edit Dialog

## Problem
The `useEffect` dependency on the entire `profile` object may not trigger re-runs when individual fields change, since React compares by reference and `profile` might be the same object reference after `refreshProfile()` reconstructs it.

## Change

### `src/components/EditProfileDialog.tsx` (lines 28-33)

Replace the current `useEffect` with more granular dependencies:

```tsx
useEffect(() => {
  if (isOpen) {
    setFullName(profile?.full_name || "");
    setPhoneNumber(profile?.phone_number || "");
  }
}, [isOpen, profile?.full_name, profile?.phone_number]);
```

This ensures the fields re-populate whenever the dialog opens or the specific profile values change, regardless of object reference stability.

No other files need changes.

