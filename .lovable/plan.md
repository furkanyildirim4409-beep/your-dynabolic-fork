

## Plan: Part 8.5 — Native Checkout & Verified Reviews on Orders

### Discovery Notes

**Orders schema check needed.** Let me inspect the current `orders` table structure and `Odemeler.tsx` (the user references this page for the "Siparişler" review entry point).
<lov-tool-use id="toolu_vrtx_01Vsh1hfCJML6q1Tr8mUVfsL" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Odemeler.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DdoNBZ4WpVRXD4XTAEPjpy" name="code--search_files" integration-id="code" data="{\"query\": \"CREATE TABLE.*orders\", \"include_patterns\": \"supabase/migrations/*.sql\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NzgT1Fx7caYTmEKC7nWhHe" name="code--search_files" integration-id="code" data="{\"query\": \"orders:\", \"include_patterns\": \"src/integrations/supabase/types.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AwafQH2Z7kKS3XxaP6mQHn" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/PaymentModal.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018NR37uEvseQuRhAYLoNMaE" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Odemeler.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01WDNZ2vFmWPxj9iCgzymSgB" name="code--search_files" integration-id="code" data="{\"query\": \"orders:\\\\s*\\\\{\", \"include_patterns\": \"src/integrations/supabase/types.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AP3BmUVKCaikCPZxaW8nbL" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/PaymentModal.tsx\", \"lines\": \"1-100\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012cLFKmVwGjLUfjzJ6Gi2SS" name="code--view" integration-id="code" data="{\"file_path\": \"src/integrations/supabase/types.ts\", \"lines\": \"1480-1560\"}">
</lov-tool-use>
Good — `orders` already has `shipping_address` JSON, `order_type`, `external_reference_id`. No DB migration needed.

<lov-plan>

## Plan: Part 8.5 — Native Checkout & Verified Reviews on Orders

### Discovery
- `orders` table already has `shipping_address jsonb`, `order_type`, `external_reference_id`, `status`. **No migration needed.**
- `Odemeler.tsx` is fully mock (uses `invoices` from `mockData`). Needs full rewrite to fetch real `orders` from Supabase.
- `PaymentModal` is generic — reusable for Shopify physical orders by passing `type: "store"`.
- `useSubmitProductReview` already exists from Part 8.3 (preserved in 8.4).

### Step A — `src/components/NativeCheckoutModal.tsx` (NEW)

Bottom-sheet modal (mobile) / centered dialog (desktop), glassmorphic, neon-lime primary. Props: `isOpen`, `onClose`, `total`, `items`, `onConfirm(address)`.

Fields with **zod validation**:
| Field | Rules |
|---|---|
| Ad Soyad | trim, 2–100 chars |
| Telefon | trim, TR phone regex `/^(\+90|0)?5\d{9}$/` |
| Şehir | Select dropdown (81 TR cities — use a flat array constant) |
| İlçe | trim, 2–60 chars |
| Tam Adres | textarea, 10–500 chars |

Order summary block at top (item count + total). CTA: **"Güvenli Ödeme Adımına Geç"** → calls `onConfirm({ fullName, phone, city, district, address })` and closes.

### Step B — `UniversalCartDrawer.tsx` Rewire

Replace `redirectToShopifyCheckout` flow:
1. Add state: `showNativeCheckout`, `pendingAddress`, `showShopifyPayment`.
2. On Shopify-only checkout click → close cart, open `NativeCheckoutModal`.
3. On address confirm → store address, open `PaymentModal` with `type: "store"`, `amount: cartTotal`.
4. On payment success → `handleShopifyPaymentSuccess()`:
   ```ts
   await supabase.from("orders").insert({
     user_id: user.id,
     order_type: "shopify",
     items: shopifyItems.map(...) as any,
     total_price: cartTotal,
     shipping_address: pendingAddress as any,
     status: "processing",
     external_reference_id: `SHOP-${Date.now()}`,
   });
   // TODO Part 8.6: Edge function → Shopify Admin API order create
   ```
   Then fire confetti, clear cart, toast success. Keep existing `PaymentReceiptModal` integration if present (currently `UniversalCartDrawer` doesn't show one — coaching just toasts; we'll mirror that pattern).
5. Remove `createShopifyCart` import and `shopifyLoading` (kept only for legacy — no longer used). Actually keep import dormant in `lib/shopify.ts` for potential future use, just stop calling it.

### Step C — `src/pages/Odemeler.tsx` Real Data + Reviews

Full rewrite:
1. Fetch `orders` where `user_id = auth.uid()` ordered by `created_at desc` via `useEffect` + `useState` (matches project pattern, no react-query for this page).
2. Recompute summary tiles dynamically (total spent, paid count, processing count).
3. Map `status` → label/color:
   - `processing` → "İşleniyor" (yellow)
   - `shipped` → "Kargoda" (blue)
   - `completed` / `paid` → "Teslim Edildi" (green)
   - `pending` → "Bekliyor" (yellow)
   - `cancelled` → "İptal" (red)
4. Each order card shows: items thumbnail strip, total, status, date, address summary (if Shopify).
5. **For each physical item** in `processing | shipped | completed` orders: render a `★ Değerlendir` button that opens `ReviewSubmissionDialog`.
6. Drop mock `invoices` import.

### Step D — `src/components/ReviewSubmissionDialog.tsx` (NEW)

Lightweight `Dialog` with: product title (header), 1–5 clickable stars, textarea (max 500 chars, optional), submit button. Uses existing `useSubmitProductReview({ productId, rating, comment })`. On success: toast + close + invalidate (the hook already invalidates `react-query` keys for that product). 

Validation: rating required (1–5), comment optional ≤500 chars, zod schema.

### Step E — Memory Update

Append to `mem://features/shopping-cart-system`: native checkout flow (address modal → PaymentModal → orders.insert with shipping_address), Odemeler page is now data-driven, verified-buyer reviews submitted from Orders page.

### Files Changed

| File | Action |
|---|---|
| `src/components/NativeCheckoutModal.tsx` | NEW — address form + zod validation |
| `src/components/ReviewSubmissionDialog.tsx` | NEW — star + comment submit |
| `src/components/UniversalCartDrawer.tsx` | Replace Shopify redirect with native modal flow |
| `src/pages/Odemeler.tsx` | Full rewrite, real Supabase orders, write-review buttons |
| `mem://features/shopping-cart-system` | Update flow notes |

**No DB migration. No edge function (Part 8.6).** `useSubmitProductReview` reused from Part 8.3.

### Open Decision
Order placement currently uses **mock payment** (PaymentModal's 2-second simulated success). Real Iyzico/Stripe is explicitly out-of-scope for this part per user spec ("we will integrate real Iyzico/Stripe later"). Confirmed by spec.

