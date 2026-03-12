

## Plan: Fixed 5-Slot Exercise Badges with Emoji + Detailed Set History Sub-Modal

### Overview
Three changes: (1) restore the card to always show 5 fixed exercise slots with emojis — matched to real data when available, empty otherwise; (2) enhance the ExerciseRecordsModal with rich badges, PR dates, and clickable rows; (3) add a sub-modal showing detailed set history when clicking an exercise.

### 1. Update `ExerciseGoalsSection.tsx` — Fixed 5 Emoji Slots

Define a static array of 5 "popular" exercises with emojis:
```typescript
const FIXED_SLOTS = [
  { name: "Bench Press", emoji: "🏋️" },
  { name: "Squat", emoji: "🦵" },
  { name: "Deadlift", emoji: "💀" },
  { name: "Shoulder Press", emoji: "💪" },
  { name: "Barbell Row", emoji: "🔥" },
];
```

For each slot, look up a match from `allExercises` by name (case-insensitive partial match). If found, show the emoji + PR weight badge. If not found, show the emoji + empty/dashed state ("—"). Always render exactly 5 slots, never more/less.

### 2. Enhance `ExerciseRecordsModal.tsx` — Rich Design with Badges

- Add Badge components: `performCount` badge (e.g. "12 antrenman"), PR weight badge, reps badge, PR date badge
- Make each exercise row clickable → opens a set history sub-modal
- Add chevron-right indicator on each row
- Show formatted PR date prominently on each card

### 3. Create `ExerciseSetHistoryModal.tsx` — Detailed Set History Sub-Modal

When clicking an exercise in the records modal:
- Open a nested Dialog/Sheet showing that exercise's complete set history across all workouts
- Fetch from `workout_logs` details JSON, filter by exercise name
- Show each workout date as a section header, with all sets listed below (weight × reps, RIR, failure badge)
- PR set highlighted with a trophy icon/badge

### 4. Update `useExerciseRecords.ts` — Add Set History Data

Extend the hook to also return a `setHistory` map: `Map<exerciseName, Array<{ date, sets[] }>>` so the sub-modal can display detailed per-workout set data without a separate query.

Add to `ExerciseRecord` interface:
```typescript
history: Array<{ date: string; sets: Array<{ weight: number; reps: number; rir?: number; isFailure?: boolean }> }>;
```

### Files
- **Modify**: `src/hooks/useExerciseRecords.ts` — add history data to each record
- **Modify**: `src/components/ExerciseGoalsSection.tsx` — fixed 5 emoji slots with data matching
- **Modify**: `src/components/ExerciseRecordsModal.tsx` — rich badges, clickable rows
- **Create**: `src/components/ExerciseSetHistoryModal.tsx` — detailed set history sub-modal

