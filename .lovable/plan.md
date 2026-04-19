

## Plan: Part 8.4 — Cart Isolation & Review Gating

### Discovery
- `CartContext.addToCart` currently merges anything → needs type-conflict guard.
- `UniversalCartDrawer` has hybrid orchestrator (sequential native→Shopify), `isHybrid` banner, split totals. With strict isolation, hybrid path is dead code → remove.
- `ShopifyProductDetailModal` has writable review form (rating stars + textarea + submit). Need to gate behind purchase verification — but Part 8.4 spec says **defer actual verification to Part 8.5** and just show a banner now.
- Existing reviews list stays read-only and visible.

### Step A — Cart Isolation (`src/context/CartContext.tsx`)

Modify `addToCart`:
```ts
const COACHING = "coaching";
const PHYSICAL = new Set(["supplement", "product"]);

addToCart(item) {
  const hasCoaching = items.some(i => i.type === COACHING);
  const hasPhysical = items.some(i => PHYSICAL.has(i.type));
  const incomingIsCoaching = item.type === COACHING;
  const incomingIsPhysical = PHYSICAL.has(item.type);

  if ((hasCoaching && incomingIsPhysical) || (hasPhysical && incomingIsCoaching)) {
    toast({
      title: "Sepet Tipi Uyuşmuyor",
      description: "Koçluk paketleri ile fiziksel ürünler aynı sepette birleştirilemez. Lütfen önce mevcut sepetinizi onaylayın.",
      variant: "destructive",
    });
    return; // do NOT add
  }
  // ... existing add/merge logic
}
```
Note: project uses `toast` from `@/hooks/use-toast` (not sonner's `toast.error`). Mirror existing pattern with `variant: "destructive"`.

### Step B — Drawer Cleanup (`src/components/UniversalCartDrawer.tsx`)

Since cart is now homogenous:
1. Remove `isHybrid` variable and the hybrid disclaimer banner.
2. Remove the sequential orchestrator's "if hasCoaching && hasShopify → run both" branch in `handlePaymentSuccess` — now it's one or the other.
3. Simplify `handleCheckout`:
   - coaching-only → open `PaymentModal`
   - shopify-only → keep current (will become native checkout in Part 8.5, see Step C)
4. Simplify CTA button label logic: only two states (`SHOPIFY İLE ÖDE` → become `SİPARİŞİ TAMAMLA`, or `ÖDEMEYE GEÇ` for coaching).
5. Per Step C: change Shopify CTA copy to **"SİPARİŞİ TAMAMLA"** + add small helper text below CTA when `hasShopify`: *"Fiziksel ürün siparişleri için adres ve ödeme adımı bir sonraki ekranda alınacaktır."*
6. Keep current Shopify redirect (`createShopifyCart`) intact for now — Part 8.5 will swap it for native checkout form. Don't break existing flow.
7. Keep BioCoin section as-is (already coaching-only post 8.2).

### Step C — Review Gating (`src/components/ShopifyProductDetailModal.tsx`)

1. Remove the writable review block: star-picker + textarea + submit button + related state (`newRating`, `newComment`, `useSubmitProductReview` mutation call).
2. Replace with a passive info banner above the reviews list:
   ```
   ┌─ ℹ️ Sadece bu ürünü satın alan kullanıcılar değerlendirme yapabilir.
   ```
   Style: muted background + border, `Info` lucide icon, small text.
3. Keep `useProductReviews` fetch + read-only list rendering 100% intact (avg rating, count, comment cards).
4. Leave `useSubmitProductReview` hook in `useProductReviews.ts` untouched — it'll be reused from the Orders page in Part 8.5.

### Files Changed

| File | Change |
|------|--------|
| `src/context/CartContext.tsx` | Add type-conflict guard in `addToCart` |
| `src/components/UniversalCartDrawer.tsx` | Strip hybrid logic, simplify checkout, update Shopify CTA copy + helper text |
| `src/components/ShopifyProductDetailModal.tsx` | Remove write-review form, add gating banner |
| `mem://features/shopping-cart-system` | Update: cart is strictly homogenous, reviews gated to verified buyers (full enforcement Part 8.5) |

**No DB migration. No new hooks. No edge functions.** `useSubmitProductReview` preserved for Part 8.5 wiring on the Orders page.

