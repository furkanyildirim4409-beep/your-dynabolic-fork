

## Plan: Real BioCoin Economy & Cart Integration

### Analysis

- **`bio_coin_transactions` table already exists** with the exact schema requested (id, user_id, amount, type, description, created_at). RLS is already configured. No migration needed.
- **`profiles.bio_coins`** is used as a cached balance across the app (Profil, Kesfet, SupplementShop, VisionAIExecution). Some places directly update this column.
- **No `useBioCoin` hook exists** — balance reads are scattered, coin spending logic is duplicated in SupplementShop and Kesfet.
- **Cart (`UniversalCartDrawer`)** has no BioCoin discount integration.
- **DailyCheckIn** has no coin reward.

### 1. Create `src/hooks/useBioCoin.ts`

Central hook that:
- Fetches `profile.bio_coins` as balance (keeps existing cached approach for speed)
- `awardCoins(amount, type, description)`: inserts positive transaction + updates `profiles.bio_coins` + shows celebratory toast
- `spendCoins(amount, type, description)`: inserts negative transaction + updates `profiles.bio_coins`
- `refetch()`: refreshes balance
- Uses `useAuth().refreshProfile()` to sync balance across the app

### 2. Update `UniversalCartDrawer.tsx`

- Import `useBioCoin`
- Add a "BioCoin İndirimi" section above checkout:
  - If balance >= 100, show a toggle to apply 100 coins = 50₺ discount
  - Show current balance, coins to use, and resulting discount
- Adjust `finalTotal = cartTotal - coinDiscount`
- On checkout success, call `spendCoins(100, 'purchase', 'Sepet İndirimi')` if discount was applied

### 3. Update `DailyCheckIn.tsx`

- Import `useBioCoin`
- On new check-in submit (not edit), call `awardCoins(50, 'bonus', 'Günlük Check-in Tamamlandı')`
- Show a coin reward animation/toast

### 4. Update `BioCoinWallet.tsx`

- Accept optional `onClick` prop (already receives balance from parent)
- No major changes needed — it's already a presentational component reading from `profile.bio_coins`

### Files

- **Create**: `src/hooks/useBioCoin.ts`
- **Modify**: `src/components/UniversalCartDrawer.tsx` — add BioCoin discount section
- **Modify**: `src/components/DailyCheckIn.tsx` — award coins on new check-in
- No database changes needed

