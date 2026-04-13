

## Plan: Purge Ghost Data from MAĞAZA Tab (Part 3 of Master Fix)

### Problem
The MAĞAZA tab has a nested sub-tab system: "ÜRÜNLER" (live products) and "SUPPLEMENTLER" (renders `<SupplementShop />` which imports `shopSupplements` from `@/lib/mockData`). The supplements sub-tab is entirely mock-driven ghost data.

### Changes to `src/pages/Kesfet.tsx`

**1. Remove imports (lines 18-19)**
- Delete: `import SupplementShop from "@/components/SupplementShop";`

**2. Flatten the MAĞAZA tab (lines 398-495)**
- Remove the nested `<Tabs defaultValue="urunler">` wrapper with its ÜRÜNLER/SUPPLEMENTLER sub-tabs
- Keep only the products grid content (Bio-Coin balance display + product grid + skeleton loading + empty state)
- Add empty state when `!productsLoading && (liveProducts ?? []).length === 0`: render `"Şu an mağazada ürün bulunmuyor."` centered message

**3. No other files touched**
- `SupplementShop.tsx` stays on disk (not deleted) in case supplements are re-enabled with live data later

### Result
The MAĞAZA tab becomes a flat, single-view product grid strictly mirroring `coach_products` from Supabase. No data in DB = empty state on screen.

### Files Changed
| File | Action |
|------|--------|
| `src/pages/Kesfet.tsx` | Remove SupplementShop import, flatten MAĞAZA tab, add empty state |

