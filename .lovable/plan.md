

# Connect Cart Checkout to Supabase Orders

## Overview
The primary checkout flow is in `UniversalCartDrawer.tsx`, which uses a `PaymentModal` and calls `handlePaymentSuccess` on completion. We need to insert the order into Supabase at that point. `CartView.tsx` has a separate "Ödemeye Geç" button that currently does nothing — we'll wire that up too.

## Changes

### 1. `src/components/UniversalCartDrawer.tsx`
- Import `supabase` and `useAuth`
- In `handlePaymentSuccess`, before clearing cart:
  - `INSERT INTO orders` with `user_id`, `items` (JSON), `total_price` (cartTotal), `total_coins_used`, `status: 'pending'`
  - On error: `toast.error("Sipariş kaydedilemedi")`, return early
  - On success: fire confetti, clear cart, show success toast

### 2. `src/components/CartView.tsx`
- Import `supabase` and `useAuth`
- Wire the "Ödemeye Geç" button to insert the order with same logic
- Add loading state to prevent double-click
- After success: `clearCart()`, `onClose()`, show toast

### No migration needed
The `orders` table already exists with correct RLS policies (users can insert/view own orders).

| File | Change |
|---|---|
| `src/components/UniversalCartDrawer.tsx` | Insert order to Supabase in `handlePaymentSuccess` |
| `src/components/CartView.tsx` | Wire checkout button to insert order to Supabase |

