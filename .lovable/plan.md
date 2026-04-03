

# Fix: Supplement State Persistence (DB + LocalStorage)

## Problem
`toggleTaken` and `refillStock` only update React state — everything resets on page reload.

## Solution (1 file: `src/hooks/useSupplements.ts`)

### Change 1: LocalStorage for daily "taken" checklist
- Build a date-scoped key: `supplements_taken_${userId}_${YYYY-MM-DD}`
- On mount (`useEffect`), read today's key → initialize `takenIds`
- On every `toggleTaken`, write updated set to localStorage
- No cleanup needed for old keys (they're naturally ignored by date mismatch)

### Change 2: Persist `servings_left` to Supabase
- In `toggleTaken` (marking as taken): after optimistic UI update, fire `supabase.from("assigned_supplements").update({ servings_left: newValue }).eq("id", id)` — only when NOT using fallback data
- In `toggleTaken` (un-marking): same pattern, increment servings_left back
- In `refillStock`: after optimistic update, fire `supabase.from("assigned_supplements").update({ servings_left: totalServings }).eq("id", id)`

### Change 3: Sync localStorage in toggleTaken
- After updating the `takenIds` set, serialize to localStorage immediately using a helper function

### Implementation Detail

```typescript
// Helper
function getTodayKey(userId: string) {
  return `supplements_taken_${userId}_${new Date().toISOString().split("T")[0]}`;
}

// useEffect to hydrate takenIds from localStorage on mount
useEffect(() => {
  if (!user) return;
  const stored = localStorage.getItem(getTodayKey(user.id));
  if (stored) {
    try { setTakenIds(new Set(JSON.parse(stored))); } catch {}
  }
}, [user]);

// In toggleTaken: after computing `next` set
const key = getTodayKey(user.id);
localStorage.setItem(key, JSON.stringify([...next]));

// DB mutation (fire-and-forget, non-blocking)
if (!useFallback) {
  supabase.from("assigned_supplements")
    .update({ servings_left: newServingsLeft })
    .eq("id", id)
    .then(({ error }) => { if (error) console.error("Stock update failed:", error); });
}
```

### Files Changed
1. `src/hooks/useSupplements.ts` — add localStorage hydration, DB mutations in toggleTaken + refillStock

No migration needed — we're updating existing `servings_left` column values via the client SDK (RLS already allows athlete reads; we need to verify update policy exists).

### RLS Check
Need to verify athletes can UPDATE their own `assigned_supplements.servings_left`. If no update policy exists, we'll add one scoped to the athlete updating only `servings_left` on their own rows.

