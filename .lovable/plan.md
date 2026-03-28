

## Free-Roam State Rehydration (Phase 3 - Epic 7 - Part 3/5)

### Problem
When jumping between exercises via "Tüm Hareketler" or swipe navigation, `currentSet` resets to 1 and completed sets disappear from the UI — even though data exists in `completedSetsRef`. The progress dots also incorrectly mark exercises as "done" based on linear index comparison.

### Root Cause
- `goToExercise()` hardcodes `setCurrentSet(1)`
- `handleExerciseRestComplete/Skip` hardcode `setCurrentSet(1)`
- Progress dots use `isDone = index < currentExerciseIndex` (linear assumption)
- No visible completed sets log rendered in the exercise info panel

### Changes — `src/components/VisionAIExecution.tsx`

**1. Rehydrate `currentSet` from `completedSetsRef` on every exercise transition**

Replace all `setCurrentSet(1)` in transition functions with smart rehydration:

```typescript
// goToExercise (line 476)
const pastSets = completedSetsRef.current[index]?.length ?? 0;
const targetSets = exercises[index]?.sets ?? 3;
setCurrentSet(pastSets < targetSets ? pastSets + 1 : targetSets);

// handleExerciseRestComplete (line 445) — same pattern using next index
// handleExerciseRestSkip (line 455) — same pattern using next index
```

**2. Centralize rehydration in the `currentExerciseIndex` useEffect (line 164)**

Extend the existing centralized effect to also sync `currentSet`, `reps`, and `achievedFailure`:

```typescript
useEffect(() => {
  if (exercises.length > 0 && exercises[currentExerciseIndex]) {
    const ex = exercises[currentExerciseIndex];
    setWeight(getSmartWeight(ex.name));
    // Rehydrate set number from completed history
    const pastSets = completedSetsRef.current[currentExerciseIndex]?.length ?? 0;
    setCurrentSet(pastSets < ex.sets ? pastSets + 1 : ex.sets);
    // Clean input state for the new set
    setReps(0);
    setAchievedFailure(false);
  }
}, [currentExerciseIndex, exercises, getSmartWeight]);
```

Then remove the now-redundant `setReps(0)`, `setCurrentSet(...)`, and `setAchievedFailure(false)` from `goToExercise`, `handleExerciseRestComplete`, and `handleExerciseRestSkip` — letting the effect handle it all.

**3. Fix progress dots "done" logic (line 674)**

Replace the linear `isDone` check with a ref-based check:

```typescript
// Before:
const isDone = index < currentExerciseIndex;

// After:
const setsCompleted = completedSetsRef.current[index]?.length ?? 0;
const isDone = setsCompleted >= exercises[index].sets;
```

**4. Add completed sets log to the info panel (before the controls area, ~line 824)**

Render the completed sets for the current exercise from `completedSetsRef`:

```typescript
{/* Completed Sets Log */}
{(completedSetsRef.current[currentExerciseIndex]?.length ?? 0) > 0 && (
  <div className="space-y-1">
    {completedSetsRef.current[currentExerciseIndex].map((s, i) => (
      <div key={i} className="flex items-center justify-between px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs">
        <span className="text-muted-foreground">Set {i + 1}</span>
        <span className="text-foreground font-display">{s.weight} kg × {s.reps}</span>
        {s.isFailure && <span className="text-red-400">🔥</span>}
      </div>
    ))}
  </div>
)}
```

Since completed sets are in a ref (not state), we need a state trigger to force re-render after `handleConfirmSet`. Add a simple counter:

```typescript
const [setsVersion, setSetsVersion] = useState(0);
// In handleConfirmSet, after pushing to completedSetsRef:
setSetsVersion(v => v + 1);
```

**5. Exercise list sheet status fix (~line 967)**

Update the exercise list sheet to also use ref-based done detection instead of `index < currentExerciseIndex`.

### Files Changed
| File | Action |
|------|--------|
| `src/components/VisionAIExecution.tsx` | Rehydrate state on navigation, fix done detection, add sets log |

