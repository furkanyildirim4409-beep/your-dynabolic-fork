

## Plan: Build React Query Hooks for Store (Part 6)

### Summary
Create `CoachProduct` interface and `src/hooks/useStoreData.ts` with `useCoachProducts` query and `usePurchaseProduct` placeholder mutation. No UI changes.

### Step 1 -- Add `CoachProduct` interface to `src/types/shared-models.ts`
Append after the existing `LeaderboardCoach` interface:
```typescript
export interface CoachProduct {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  coach?: {
    full_name: string;
    avatar_url: string | null;
  };
}
```

### Step 2 -- Create `src/hooks/useStoreData.ts`

**`useCoachProducts()`**
- Query key: `["coach-products"]`
- Fetches from `coach_products` with `.eq('is_active', true)`, joined with `profiles!coach_id(full_name, avatar_url)`
- Orders by `created_at` desc
- Maps to `CoachProduct[]` with safe optional chaining on the profile join
- `staleTime: 300_000`

**`usePurchaseProduct()`**
- `useMutation` accepting `{ productId: string; price: number }`
- Simulates delay with `setTimeout` (1s) and returns `true`
- Placeholder for future Bio-Coin ledger integration

### Files Changed
| File | Action |
|------|--------|
| `src/types/shared-models.ts` | Append `CoachProduct` interface |
| `src/hooks/useStoreData.ts` | New file with both hooks |

No UI files touched. No database changes.

