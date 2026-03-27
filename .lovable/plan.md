

## Plan: Weekly Summary Deep Link Patch

### What We're Building
When a user taps a weekly digest push notification, they land on `/profil?showSummary=true`. We need to intercept that query param, trigger the Weekly Recap modal, and clean up the URL.

### Current State
- `WeeklyRecapModal` and `useWeeklyRecap` exist but are only used in `Kokpit.tsx`
- `Profil.tsx` has no weekly recap integration or `useSearchParams`

### Implementation — Single File: `src/pages/Profil.tsx`

1. **Add imports**: `useSearchParams` from `react-router-dom`, `useEffect` from React, `WeeklyRecapModal` from components, `useWeeklyRecap` hook

2. **Wire up the hook** inside the component:
   ```
   const [searchParams, setSearchParams] = useSearchParams();
   const { showRecap, recapData, triggerRecap, dismissRecap } = useWeeklyRecap();
   ```

3. **Add useEffect** to detect the deep link param and auto-trigger:
   ```
   useEffect(() => {
     if (searchParams.get("showSummary") === "true") {
       triggerRecap();
       searchParams.delete("showSummary");
       setSearchParams(searchParams, { replace: true });
     }
   }, [searchParams]);
   ```

4. **Render `WeeklyRecapModal`** at the bottom of the JSX:
   ```
   <WeeklyRecapModal isOpen={showRecap} onClose={dismissRecap} data={recapData} />
   ```

5. **Replace `useNavigate`** — since `useSearchParams` is added, keep `useNavigate` as-is (both can coexist).

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Profil.tsx` | Add `useSearchParams`, `useWeeklyRecap`, deep link effect, and `WeeklyRecapModal` render |

