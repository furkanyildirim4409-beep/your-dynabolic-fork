

## Plan: Sync Workout History Calorie Algorithm with Weekly Stats

### Problem
`useWorkoutHistory.ts` uses only 2 pillars (MET base + EPOC), while `useWeeklyWorkoutStats.ts` uses all 3 pillars. The tonnage/mechanical bonus (`+20 kcal per 1,000 kg`) is missing from history.

### Fix
**`src/hooks/useWorkoutHistory.ts`** — Line 84, add Pillar 3:

```typescript
// Current (2-pillar):
const calories = Math.round(baseBurn + failureSets * 15);

// Updated (3-pillar, matching useWeeklyWorkoutStats):
const mechanicalBonus = (Number(tonnageKg) / 1000) * 20;
const calories = Math.round(baseBurn + failureSets * 15 + mechanicalBonus);
```

Also align the failure-set detection to check `rir === 0` like the weekly hook does — currently the history hook only checks `isFailure`/`is_failure` but misses `rir === 0` sets.

### Files
- **Modify**: `src/hooks/useWorkoutHistory.ts` (1 line change + rir check)

No other files or DB changes needed.

