

# Connect Wallet and Supplement Shop to Supabase

## Problem
`BioCoinWallet` in `Kesfet.tsx` and `SupplementShop.tsx` both use a hardcoded `USER_BIO_COINS = 2450` mock constant instead of the real `bio_coins` from the `profiles` table. `Profil.tsx` already correctly uses `profile?.bio_coins`.

## Approach
Use the existing `useAuth()` hook which already fetches `profile.bio_coins` from Supabase. No new hooks or realtime subscriptions needed — the `AuthContext` already handles profile fetching on auth state change.

For coin deduction on purchase, call Supabase directly to update `profiles.bio_coins` and refetch the profile.

No database migrations needed — `profiles.bio_coins` column already exists with RLS allowing self-updates.

## Changes

### 1. `src/pages/Kesfet.tsx`
- Remove `USER_BIO_COINS` constant and local `bioCoins` state
- Import `useAuth` and use `profile?.bio_coins ?? 0` for the wallet balance
- Pass real balance to discount calculations
- When coins are used in `handleAddToCart`, call `supabase.from('profiles').update({ bio_coins: newBalance })` to persist the deduction

### 2. `src/components/SupplementShop.tsx`
- Remove `USER_BIO_COINS` constant and local `bioCoins` state
- Import `useAuth` and `supabase`
- Use `profile?.bio_coins ?? 0` as the live balance
- In `handleAddToCart`, when `isDiscountActive`:
  - Check sufficient balance, show `toast.error("Yetersiz bakiye!")` if not enough
  - Call Supabase to deduct coins: `UPDATE profiles SET bio_coins = bio_coins - coinsNeeded`
  - Re-fetch profile to sync the updated balance in AuthContext
  - Show `toast.success("Bio-Coin indirimi uygulandı!")`

### 3. `src/context/AuthContext.tsx`
- Export `refreshProfile()` function so components can force a profile refetch after coin updates

| File | Change |
|---|---|
| `src/context/AuthContext.tsx` | Add `refreshProfile` to context |
| `src/pages/Kesfet.tsx` | Replace mock coins with `useAuth().profile.bio_coins`, persist deductions |
| `src/components/SupplementShop.tsx` | Replace mock coins with `useAuth().profile.bio_coins`, persist deductions to Supabase |

