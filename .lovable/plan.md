

# Connect Order History to Supabase

## Overview
`Payments.tsx` currently shows coach invoices from mock data. We'll add a new "SİPARİŞLERİM" (My Orders) section that fetches real orders from the `orders` table, while keeping the existing invoice/payment functionality intact.

## Changes

### `src/pages/Payments.tsx`
- Import `useAuth` from `@/context/AuthContext` and `supabase` from `@/integrations/supabase/client`
- Add a `useEffect` to fetch orders: `supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })`
- Add `orders`, `ordersLoading` state
- Add a new section "SİPARİŞLERİM" after the payment history section with:
  - **Skeleton loader** when `ordersLoading` is true (3 skeleton cards)
  - **Empty state** when orders array is empty: Package icon + "Henüz bir siparişiniz bulunmuyor."
  - **Order cards** mapped from fetched data:
    - Parse `items` JSONB to build summary text (first item title + "ve X diğer ürün")
    - Display `total_price` formatted as TRY currency
    - Display `total_coins_used` if > 0 as a coin badge
    - Status badge with Turkish labels: `pending` -> "Hazırlanıyor" (amber), `shipped` -> "Kargolandı" (blue), `delivered` -> "Teslim Edildi" (green), `cancelled` -> "İptal" (red)
    - Formatted `created_at` date

### No database or migration changes needed
The `orders` table already exists with proper RLS policies for user self-read.

