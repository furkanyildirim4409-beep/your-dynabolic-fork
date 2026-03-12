

## Plan: AI Supplement Badges on Blood Test Cards + Cart Integration

### Analysis

- **Cart system already exists** (`CartContext`, `UniversalCartDrawer`, `FloatingCartButton`) — no need to create a new one.
- **Coach flow already uses real Supabase data** — `CoachBloodworkModal` fetches from `blood_tests` by `athleteId`, no mock data present. No changes needed.
- **Supplement suggestion logic** lives inside `BloodworkDetailModal` — needs to be extracted into a shared utility.

### 1. Extract Supplement Logic → `src/lib/supplementSuggestions.ts`

Move `supplementMap`, `highSupplementMap`, `generateSupplementSuggestions`, and add pricing:

```typescript
const supplementPrices: Record<string, number> = {
  "Vitamin D3 + K2 (2000 IU)": 120,
  "Demir Bisglisinat": 95,
  "Metilkobalamin B12 (1000 mcg)": 110,
  "Magnezyum Bisglisinat (400 mg)": 130,
  "Çinko + D3 + Ashwagandha": 180,
  "Omega-3 (EPA/DHA) 2000 mg": 250,
  "Ashwagandha + Magnezyum": 160,
};
```

Each suggestion gets a unique `id` (slugified name), `price`, and `image` (placeholder).

### 2. Update `BloodworkUpload.tsx`

- Import shared `generateSupplementSuggestions` and `useCart`
- For each analyzed test card, compute suggestions. If `suggestions.length > 0`, render a glowing purple badge: `"✨ {count} Takviye Önerisi"`
- In the expanded section, show suggestion cards with **"Sepete Ekle"** buttons calling `addToCart()` with `type: "supplement"`
- Remove the old toast-only flow

### 3. Update `BloodworkDetailModal.tsx`

- Import shared suggestion logic from the new utility
- Replace `handleOrder` toast with `useCart().addToCart()`
- Keep `handleAddStock` as-is (inventory simulation)

### Files

- **Create**: `src/lib/supplementSuggestions.ts`
- **Modify**: `src/components/BloodworkUpload.tsx` — add AI badges + cart integration
- **Modify**: `src/components/BloodworkDetailModal.tsx` — use shared logic + real cart

No database changes needed. No coach flow changes needed (already clean).

