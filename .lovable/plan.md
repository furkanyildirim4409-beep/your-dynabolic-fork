

# Nutrition Epic Part 4A: FatSecret API Integration

## Overview

Replace OpenFoodFacts with FatSecret REST API (OAuth 2.0 Client Credentials) in the `search-food` edge function. Support both text search and barcode lookup. Parse FatSecret's string-based nutrition format into structured macro data.

## Prerequisites — Secrets

Two secrets need to be added before deployment:
- `FATSECRET_CLIENT_ID` — the OAuth client ID
- `FATSECRET_CLIENT_SECRET` — value: `245cb40864764e0aafcfa4ba9800674e`

The user will need to provide the Client ID (not mentioned in the request).

## File: `supabase/functions/search-food/index.ts` — Full Rewrite

### OAuth 2.0 Token Helper
- `getAccessToken()`: POST to `https://oauth.fatsecret.com/connect/token` with `grant_type=client_credentials`, `scope=basic premier barcode`, using Basic Auth (`base64(client_id:client_secret)`)
- Cache token in a module-level variable with expiry check to avoid re-fetching on every request

### Request Body
Accept `{ query?: string, barcode?: string }` — at least one required.

### Search Flow
1. **Text search**: GET `https://platform.fatsecret.com/rest/foods/search/v1?search_expression={query}&format=json&max_results=10` with Bearer token
2. **Barcode lookup**: GET `https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1?barcode={barcode}&format=json` → returns a single food with servings

### Description Parser (Critical)
FatSecret returns nutrition as a string like:
```
"Per 100g - Calories: 22kcal | Fat: 0.34g | Carbs: 3.28g | Protein: 3.09g"
```

Regex extraction:
```typescript
function parseFatSecretDescription(desc: string) {
  const cal = desc.match(/Calories:\s*([\d.]+)/i);
  const fat = desc.match(/Fat:\s*([\d.]+)/i);
  const carbs = desc.match(/Carbs:\s*([\d.]+)/i);
  const protein = desc.match(/Protein:\s*([\d.]+)/i);
  return {
    calories: Math.round(parseFloat(cal?.[1] || "0")),
    protein: Math.round(parseFloat(protein?.[1] || "0") * 10) / 10,
    carbs: Math.round(parseFloat(carbs?.[1] || "0") * 10) / 10,
    fat: Math.round(parseFloat(fat?.[1] || "0") * 10) / 10,
  };
}
```

### Output Format (Unchanged)
Keep the same shape consumed by `useConsumedFoods`:
```json
{
  "id": "fatsecret_food_id",
  "name": "Spinach",
  "brand": "Generic",
  "calories": 22,
  "protein": 3.1,
  "carbs": 3.3,
  "fat": 0.3,
  "serving_size": "100g"
}
```

### Error Handling
- 401 from FatSecret → clear cached token, retry once
- 429 → return 429 with "rate_limit" error
- Missing/unparseable description → skip that food item

## Client-Side Changes

### `src/hooks/useConsumedFoods.ts` — Minor
Update `searchFood` to also accept an optional `barcode` param:
```typescript
const searchFood = async (query: string, barcode?: string) => {
  const { data } = await supabase.functions.invoke("search-food", {
    body: barcode ? { barcode } : { query: query.trim() },
  });
};
```

### `src/pages/Beslenme.tsx` — Wire Barcode Scanner
The barcode scanner UI already exists (lines 183-340, `openBarcodeScanner`). Currently it's a mock that shows a toast after 2.5s. Wire it to actually call `searchFood(undefined, scannedBarcode)` — though the actual camera/barcode reading hardware API is out of scope, we can at least connect the flow so when a barcode value is available, it hits FatSecret.

## Summary

| File | Change |
|---|---|
| `supabase/functions/search-food/index.ts` | Full rewrite: OAuth 2.0 + FatSecret search + barcode + description parser |
| `src/hooks/useConsumedFoods.ts` | Add optional `barcode` param to `searchFood` |
| `src/pages/Beslenme.tsx` | Wire barcode scanner result to `searchFood` with barcode param |

