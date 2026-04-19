

## Plan: Part 8.6 — Shopify Admin Sync & Coach Prescriptions

### Discovery
<lov-tool-use id="toolu_vrtx_01RzR2fQjWkhnaUxoaA41ziG" name="code--search_files" integration-id="code" data="{\"query\": \"AssignSupplementDialog\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01UzZkDoxNR4zk9vsEexWZYS" name="code--search_files" integration-id="code" data="{\"query\": \"assigned_supplements\", \"include_patterns\": \"src/**/*.ts,src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0173nbQQGFziu1oNB3gV69oU" name="code--search_files" integration-id="code" data="{\"query\": \"AssignSupplement\", \"include_patterns\": \"src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01ED8VB7hgwxQzpGXX8NWTpp" name="code--search_files" integration-id="code" data="{\"query\": \"assigned_supplements\", \"include_patterns\": \"src/**/*.ts,src/**/*.tsx\"}">
</lov-tool-use>
No `AssignSupplementDialog` component exists. Let me check what coach-side prescription UI exists.
<lov-tool-use id="toolu_vrtx_016BMGy267KBmpj6c2GiahB5" name="code--exec" integration-id="code" data="{\"command\": \"grep -rln \\\"assigned_supplements\\\" /dev-server/src --include=\\\"*.tsx\\\" 2>/dev/null; echo \\\"---\\\"; grep -rln \\\"Takviye Ata\\\\|Prescribe\\\\|prescribe\\\\|supplement.*assign\\\\|AssignSupp\\\" /dev-server/src --include=\\\"*.tsx\\\" 2>/dev/null\", \"user_facing_description\": \"Looking for the coach prescription UI\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NrqtYdQZmmok9QXJDSz6it" name="code--view" integration-id="code" data="{\"file_path\": \"src/integrations/supabase/types.ts\", \"lines\": \"125-180\"}">
</lov-tool-use>
No existing AssignSupplementDialog. Need to clarify or assume creation. Spec says "currently this dialog uses mock data" — but it doesn't exist. I'll plan to create it. Also need to check existing `external_reference_id` field and `SHOPIFY_ADMIN_TOKEN` secret status.

Secrets check shows: `SHOPIFY_DOMAIN` ✓, `SHOPIFY_STOREFRONT_TOKEN` ✓, **`SHOPIFY_ADMIN_TOKEN` MISSING**.

<lov-plan>

## Plan: Part 8.6 — Shopify Admin Sync & Coach Prescriptions

### Discovery
- `orders` table has `external_reference_id` ready for Shopify Order GID. ✓
- `assigned_supplements` schema: `name_and_dosage`, `dosage`, `icon`, `timing`, `total_servings`, `coach_id`, `athlete_id`. **No `shopify_product_id` column** — needs migration to link prescriptions to real Shopify products.
- **`AssignSupplementDialog` does not exist** in the codebase. Spec says it does — it doesn't. I'll **create it from scratch** as a coach-side modal (mountable from the coach's athlete-detail view).
- **`SHOPIFY_ADMIN_TOKEN` secret is NOT set**. Will request via `add_secret` first thing — Edge Function blocked until added.

### Step A — Secret + Migration

1. Request **`SHOPIFY_ADMIN_TOKEN`** via add_secret (Custom App admin access token, format `shpat_...`).
2. Migration: add `shopify_product_id text` and `shopify_variant_id text` (nullable) to `assigned_supplements`. Backwards compatible — existing rows untouched.

### Step B — Edge Function: `sync-shopify-order`

`supabase/functions/sync-shopify-order/index.ts` — `verify_jwt = true`, JWT validated in code via `getClaims`.

**Input (POST JSON):**
```ts
{ orderId: string, shippingAddress: {...}, items: [{ shopifyVariantId, quantity, price, title }] }
```

**Logic:**
1. Validate JWT → extract `userId`.
2. Zod-validate body.
3. Confirm `orders` row belongs to `userId` (service-role client query).
4. Build Shopify Admin REST payload `POST https://${SHOPIFY_DOMAIN}/admin/api/2024-10/orders.json`:
   ```json
   { "order": {
     "line_items": [{ "variant_id": <numeric>, "quantity": N }],
     "shipping_address": { first_name, last_name, address1, city, province, country: "TR", phone, zip: "" },
     "customer": { first_name, last_name, phone },
     "financial_status": "paid",
     "send_receipt": false,
     "send_fulfillment_receipt": false
   }}
   ```
   Header: `X-Shopify-Access-Token: ${SHOPIFY_ADMIN_TOKEN}`. Note: `variant_id` must be the numeric portion of the GID (`gid://shopify/ProductVariant/12345` → `12345`).
5. On success: update `orders.external_reference_id = shopifyOrder.id::text`, set `status='processing'` (idempotent).
6. On failure: log error, return 500 — **do NOT roll back the Supabase order** (user already paid; we'll alert manually). Append failure note to `orders.notes` if column exists, otherwise just return error for client toast.

CORS headers included in all responses.

### Step C — Wire `UniversalCartDrawer.tsx`

In `handleShopifyPaymentSuccess` after the `orders.insert` returns the new row id:
```ts
const { data: order } = await supabase.from("orders").insert({...}).select("id").single();
// fire-and-forget — user shouldn't wait on Shopify Admin
supabase.functions.invoke("sync-shopify-order", {
  body: { orderId: order.id, shippingAddress: pendingAddress, items: shopifyItems.map(i => ({
    shopifyVariantId: i.shopifyVariantId, quantity: i.quantity, price: i.price, title: i.title
  })) }
}).then(({ error }) => { if (error) console.error("Shopify sync failed:", error); });
```
User flow stays instant; sync happens in background. Keep existing confetti/toast UX.

### Step D — `AssignSupplementDialog.tsx` (NEW)

`src/components/coach/AssignSupplementDialog.tsx` — coach-facing modal.

**Props:** `isOpen`, `onClose`, `athleteId`, `athleteName`.

**UI:**
1. **Search box** → debounced `getProducts({ query, limit: 20 })` from `@/lib/shopify`.
2. **Result list** (cards with image/title/price). Click selects.
3. **Selected product preview** + form:
   - Dosage (text, e.g., "1 kapsül")
   - Timing (select: Sabah / Öğle / Akşam / Antrenman öncesi / Antrenman sonrası / Yatmadan)
   - Total servings (number, default 30)
4. **Submit** → `insert into assigned_supplements`:
   ```ts
   { coach_id: user.id, athlete_id, name_and_dosage: product.title,
     dosage, timing, total_servings, servings_left: total_servings, icon: '💊',
     shopify_product_id: product.id, shopify_variant_id: product.variantId }
   ```
5. Toast + invalidate `["assigned_supplements", athleteId]` query, close.

**Mount point:** spec says "athlete-detail view". Confirmed at exec time; if no obvious coach athlete-detail page exists, mount in `CoachAthletes.tsx` per-row action button "Takviye Ata".

**Athlete-side display:** `useSupplements` already reads from `assigned_supplements` — Coach prescriptions appear automatically in the athlete's `SupplementTracker`. Existing "Add to cart" path uses Shopify variantId from the new column → user can buy the same product the coach prescribed. (Update `useSupplements` select to include the two new columns.)

### Step E — Documentation

Update `mem://features/shopping-cart-system`: append Shopify Admin sync architecture (Edge Function fire-and-forget, GID→numeric variant mapping, `SHOPIFY_ADMIN_TOKEN` requirement). Update `mem://features/assigned-supplements-tracking`: coach prescriptions now linked to Shopify product IDs; create `mem://features/coach-supplement-prescriptions` for the new dialog.

### Files Changed

| File | Action |
|---|---|
| `supabase/functions/sync-shopify-order/index.ts` | NEW — REST Admin order create |
| `supabase/config.toml` | Register function (verify_jwt default) |
| migration `*.sql` | Add `shopify_product_id`, `shopify_variant_id` to `assigned_supplements` |
| `src/components/UniversalCartDrawer.tsx` | Invoke sync function post-insert |
| `src/components/coach/AssignSupplementDialog.tsx` | NEW — coach prescription modal |
| `src/pages/CoachAthletes.tsx` (or athlete-detail) | Mount the dialog with trigger button |
| `src/hooks/useSupplements.ts` | Select new columns so cart-add works |
| `mem://features/shopping-cart-system` | Append admin sync notes |
| `mem://features/assigned-supplements-tracking` | Note Shopify linkage |

### Required User Action (Before Edge Function Works)

User must create a **Shopify Custom App** in Shopify Admin → Settings → Apps → Develop apps → grant `write_orders` scope → install → copy the Admin API access token (`shpat_...`) → paste when prompted.

### Open Decision Confirmed
- Sync is **fire-and-forget** (background) so the buyer's UX isn't blocked by Shopify latency. Failures logged for manual reconciliation.
- Variant ID conversion: GID string → trailing numeric segment via `id.split("/").pop()`.

