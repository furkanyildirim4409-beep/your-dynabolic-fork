

## Add Superset Visual Cues to Exercise List

### Summary
Add `group_id` parsing to the exercise data pipeline and render visual superset grouping (colored left border + badge) in the `WorkoutCard` expandable list. No changes to Vision AI or active workout engine.

### Changes

**1. `src/hooks/useAssignedWorkouts.ts`**
- Add `groupId?: string` to `TransformedExercise` interface.
- In the exercise mapping, pass through `ex.group_id ?? ex.groupId` as `groupId`.

**2. `src/components/WorkoutCard.tsx`**
- Add `groupId?: string` to `ExerciseDetail` interface.
- Replace the flat `.map()` rendering with grouped rendering logic:
  - Before mapping, compute groups: iterate exercises, collect runs of adjacent items sharing the same non-null `groupId`.
  - For grouped exercises: wrap them in a container with `border-l-2 border-primary pl-2` and render a `"🔗 Süperset"` badge above the group.
  - Ungrouped exercises render as-is (current layout preserved).
- All existing badge logic (RIR/RPE/Failure) remains untouched inside each exercise row.

### File count: 2 files modified

