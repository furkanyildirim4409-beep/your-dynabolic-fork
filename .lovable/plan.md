

## Plan: PR UI/UX Polish (Part 2.5)

### Summary
Three visual fixes in `PersonalRecords.tsx`: (1) remove absolute positioning on list view badges, (2) remove absolute positioning on detail view badge, (3) overhaul stats grid to show actual lifted PR vs theoretical 1RM.

### Changes to `src/components/PersonalRecords.tsx`

**1. List View Badge Fix (lines 170-181)**

Replace the absolutely-positioned badge + standalone emoji with a flex row:

```tsx
<div className="flex justify-between items-start mb-2">
  <span className="text-2xl">{getExerciseEmoji(pr.name)}</span>
  {pr.isRecent && (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
      className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
      <Sparkles className="w-2 h-2" /> YENİ
    </motion.div>
  )}
</div>
```

**2. Detail View Badge Fix (lines 245-256)**

Replace the absolutely-positioned badge + standalone emoji with a centered flex column:

```tsx
<div className="flex flex-col items-center justify-center">
  {lift.isRecent && (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
      className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 mb-3">
      <Sparkles className="w-3 h-3" /> YENİ POTANSİYEL
    </motion.div>
  )}
  <span className="text-4xl">{getExerciseEmoji(lift.name)}</span>
</div>
```

**3. Stats Grid Overhaul (lines 226-229, 326-339)**

Change calculation logic:
```typescript
const realPR = lift.maxWeight;
const gain = lift.estimated1RM - realPR;
const pct = realPR > 0 ? Math.round((gain / realPR) * 100) : 0;
```

Update grid labels:
- "Başlangıç" → "GERÇEK PR" showing `{realPR}kg`
- "Artış" → "POTANSİYEL" showing `+{gain}kg`
- "Yüzde" → "FARK" showing `+{pct}%`

### Files Changed

| File | Action |
|------|--------|
| `src/components/PersonalRecords.tsx` | Fix badge overlaps (list + detail), overhaul stats grid |

