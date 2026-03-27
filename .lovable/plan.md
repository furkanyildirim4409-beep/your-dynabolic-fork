

## QuickActionFAB Water Hotfix

### What's Wrong
The FAB already calls `addWaterBackend(250)` correctly, but it's missing:
1. **No loading guard** — users can spam-click and create duplicate entries
2. **No error handling** — failures are silently swallowed
3. **`isLoading` not destructured** from the hook

### Fix (single file: `src/components/QuickActionFAB.tsx`)

**Line 28** — Add `isLoading` to destructuring:
```ts
const { totalMl, addWater: addWaterBackend, isLoading: isWaterLoading } = useWaterTracking();
```

**Lines 34-43** — Replace `handleAddWater` with guarded version:
```ts
const handleAddWater = async () => {
  if (isWaterLoading) return;
  const err = await addWaterBackend(250);
  if (!err) {
    toast({
      title: "Harika! +250ml su eklendi 💧",
      description: `Bugün toplam: ${((totalMl + 250) / 1000).toFixed(1)}L`,
    });
  } else {
    toast({
      title: "Hata",
      description: "Su eklenirken bir sorun oluştu.",
      variant: "destructive",
    });
  }
  setIsOpen(false);
};
```

That's the entire change — two edits in one file.

