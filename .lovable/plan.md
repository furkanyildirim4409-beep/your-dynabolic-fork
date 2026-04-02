

# Nutrition Epic 4A.1: FatSecret Turkish Localization Hotfix

## Problem
Searching Turkish food terms (e.g. "tavuk") returns no results because FatSecret defaults to the US/English region.

## Fix
Add `region: "TR"` and `language: "tr"` parameters to all three `signedRequest()` calls in `supabase/functions/search-food/index.ts`.

### Changes (3 locations in one file)

**1. `searchByText` (line 100-104)** — add locale params:
```typescript
const data = await signedRequest({
  method: "foods.search",
  search_expression: query,
  max_results: "15",
  region: "TR",
  language: "tr",
});
```

**2. `searchByBarcode` — barcode lookup (line 129-132)** — add locale params:
```typescript
const barcodeData = await signedRequest({
  method: "food.find_id_for_barcode",
  barcode,
  region: "TR",
  language: "tr",
});
```

**3. `searchByBarcode` — food detail fetch (line 138-141)** — add locale params:
```typescript
const detail = await signedRequest({
  method: "food.get.v4",
  food_id: foodId,
  region: "TR",
  language: "tr",
});
```

No other files need changes. Deploy and test with a Turkish query to verify.

