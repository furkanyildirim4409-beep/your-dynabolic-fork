

## Premium UI Polish for Hypertrophy Tracking

Three surgical UI replacements in `src/components/VisionAIExecution.tsx`. No state or logic changes.

### 1. Target Reps Badge (line 758)
Replace `Hedef: {exercise.sets}x{exercise.reps}` with a sleek glassmorphic badge showing only reps (sets already visible in top-right radar):
```
<span className="ml-2 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-sm">
  Hedef: {exercise.reps} Tekrar
</span>
```

### 2. Liquid Glass Failure Toggle (lines 832-837)
Replace the checkbox+label with a full-width glassmorphic button that toggles `achievedFailure`. Red glow when active, muted dark when inactive:
```jsx
<button
  onClick={() => setAchievedFailure(!achievedFailure)}
  className={`w-full py-3 rounded-xl mb-1 font-bold tracking-wide transition-all duration-300 border backdrop-blur-md flex items-center justify-center gap-2
    ${achievedFailure 
      ? 'bg-red-600/40 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
      : 'bg-black/40 border-red-900/50 text-red-500/70 hover:bg-black/60'}`}
>
  🔥 TÜKENİŞE ULAŞTIM {achievedFailure && '(ONAYLANDI)'}
</button>
```

### 3. Live Progressive Overload Indicator (after line 831, before failure toggle)
Compute `prevMax` from `previousWorkout.details` for the current exercise, then show a pill badge below the weight/reps/timer grid. Glows green when current weight exceeds previous record:
```jsx
{prevMax > 0 && (
  <div className="text-center">
    <span className={`text-xs px-2 py-1 rounded-full border backdrop-blur-sm transition-colors
      ${weight > prevMax 
        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
        : 'bg-white/5 border-white/10 text-white/50'}`}>
      Geçmiş Rekor: {prevMax} kg {weight > prevMax && `(🚀 +${weight - prevMax} kg)`}
    </span>
  </div>
)}
```

All three changes are purely visual — no state variables, handlers, or save logic are modified.

