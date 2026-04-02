

# Nutrition Epic 4A — Plan B: OpenFoodFacts Pivot

## Summary
Full rewrite of `supabase/functions/search-food/index.ts` — remove all FatSecret/OAuth logic, replace with OpenFoodFacts (OFF) integration using strict User-Agent headers and Turkish-localized endpoints.

## Changes (1 file)

**`supabase/functions/search-food/index.ts`** — complete rewrite:

1. **Remove** all FatSecret code (OAuth 1.0 signing, HMAC-SHA1, description parser, etc.)

2. **Add shared fetch helper** with mandatory User-Agent:
```typescript
const USER_AGENT = "DynabolicApp/1.0 - Web - (Contact: hello@dynabolic.com)";

async function offFetch(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT }
  });
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  return res.json();
}
```

3. **Text search** — Turkish-localized endpoint:
```
https://tr.openfoodfacts.org/cgi/search.pl?search_terms=...&search_simple=1&action=process&json=1&page_size=15
```
Parse `products[]` array, filter items that have valid nutriments.

4. **Barcode search** — world V2 API:
```
https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

5. **Normalizer** — map OFF `product.nutriments` to our standard format:
```typescript
{
  id: product.code || product._id,
  name: product.product_name_tr || product.product_name || "Bilinmeyen Ürün",
  brand: product.brands || "",
  calories: Math.round(nutriments["energy-kcal_100g"] || 0),
  protein: round1(nutriments.proteins_100g || 0),
  carbs: round1(nutriments.carbohydrates_100g || 0),
  fat: round1(nutriments.fat_100g || 0),
  serving_size: "100g"
}
```
Filter out items where all macros are zero.

6. **Graceful error handling** — on any OFF failure (503, timeout, etc.), return `200` with empty array and a soft Turkish warning message so the client never crashes.

7. **Main handler** stays the same shape (CORS, parse body, route to text/barcode, return JSON array).

No frontend changes needed — the response contract (array of `{id, name, brand, calories, protein, carbs, fat, serving_size}`) remains identical.

