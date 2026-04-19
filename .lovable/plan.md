

## Plan: Part 8.3 — Product Detail & Real Reviews Engine

### Discovery Notes
- Existing `src/components/ProductDetail.tsx` is mock-rated (hardcoded 4.0 stars), tied to old product shape (`type: ebook|pdf|apparel...`). Will be replaced — not adapted — to keep contracts clean.
- `useShopifyProducts` already returns `ShopifyProduct` with `description`. Good.
- `Kesfet.tsx` Mağaza grid + `SupplementShop.tsx` cards are the two click surfaces.
- BioCoin scope: Per Part 8.2, Shopify items are **excluded** from BioCoin discount. Detail modal "Add to Cart" must NOT show BioCoin teaser — instead a small disabled-state note matching cart drawer ("Shopify ürünlerinde BioCoin yakında").

### Step A — DB Migration: `product_reviews`

```sql
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,        -- Shopify GID, e.g. gid://shopify/Product/123
  user_id uuid NOT NULL,            -- NOT a FK to auth.users (Supabase rule)
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)      -- one review per user per product
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone"
  ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY "Users insert own reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id, created_at DESC);
```

⚠️ Deviation from spec: Removing `REFERENCES auth.users(id)` per project guideline "NEVER use a foreign key to auth.users". `user_id` is enforced via RLS. Also added UNIQUE constraint to prevent spam, and UPDATE/DELETE policies for review editing.

### Step B — Hook: `src/hooks/useProductReviews.ts`

```ts
export function useProductReviews(productId: string) {
  // Fetch reviews + LEFT JOIN profiles(full_name, avatar_url) via select string
  // Returns: { reviews, averageRating, totalCount, userReview, isLoading, submitReview, isSubmitting }
  // submitReview(rating, comment) → upsert on (product_id, user_id) so re-rating works
  // After mutation: refetch via local state (no react-query in project — match useStoreData pattern)
}
```
Pattern matches existing hooks (`useFollowSystem`, `usePostComments`) — plain `useState` + `useEffect` + manual refetch, no react-query introduced.

### Step C — `src/components/ShopifyProductDetailModal.tsx` (new)

Replaces old `ProductDetail.tsx` for Shopify products. Layout:

```
┌─────────────────────────────────┐
│ [X]    Hero image (aspect-square)│
├─────────────────────────────────┤
│ Title · Price · ★4.3 (12)       │
│ ┌─[ SEPETE EKLE ]─┐             │
│ "BioCoin yakında" mini disclaimer│
├─────────────────────────────────┤
│ AÇIKLAMA                        │
│ {product.description}           │
├─────────────────────────────────┤
│ DEĞERLENDİRMELER (avg + count)  │
│ ┌─ Write review (auth only) ──┐ │
│ │  ★★★★★ click + textarea     │ │
│ │  [ Gönder ]                 │ │
│ └────────────────────────────┘ │
│ • Avatar · Name · ★★★★ · date  │
│   "Comment text..."             │
│ • ... (list)                    │
└─────────────────────────────────┘
```

Style: glass-morphism, neon lime primary (`#b2d928`), framer-motion bottom-sheet on mobile / centered dialog on desktop — same pattern as existing `ProductDetail.tsx`. Drag-to-dismiss preserved.

Add-to-cart payload:
```ts
addToCart({
  id: product.id,                    // Shopify GID
  shopifyVariantId: product.variantId,
  type: "supplement",                // or "product" — passed via prop
  title, price, image, ...
});
```

### Step D — Wire Click Handlers

**`Kesfet.tsx` Mağaza grid:**
- Add `const [selected, setSelected] = useState<ShopifyProduct | null>(null)`
- Wrap card in `<button onClick={() => setSelected(p)}>` (keep "SEPETE EKLE" button as `stopPropagation` action)
- Render `<ShopifyProductDetailModal isOpen={!!selected} product={selected} onClose={() => setSelected(null)} cartType="product" />`

**`SupplementShop.tsx`:** identical pattern with `cartType="supplement"`.

### Step E — Cleanup
- Old `src/components/ProductDetail.tsx` is still referenced? Quick search needed at exec time. If unused → delete. If referenced by legacy mock code → leave dormant.

### Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/<ts>_product_reviews.sql` | New table + RLS |
| `src/hooks/useProductReviews.ts` | New hook |
| `src/components/ShopifyProductDetailModal.tsx` | New modal |
| `src/pages/Kesfet.tsx` | Click handler + modal mount |
| `src/components/SupplementShop.tsx` | Click handler + modal mount |
| `mem://features/shopping-cart-system` | Append: product detail + reviews flow |

**No edge functions. No new env vars.**

