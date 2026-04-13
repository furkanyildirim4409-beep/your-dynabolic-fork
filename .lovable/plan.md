

## Plan: Inject Live Store Data into MAĞAZA Tab (Part 7)

### Summary
Replace `getAllProducts()` mock data with `useCoachProducts` live data in the MAĞAZA tab. Add skeleton loading state. Hook up purchase mutation. Remove remaining mock imports.

### Changes to `src/pages/Kesfet.tsx`

**1. Imports (lines 1-20)**
- Add: `import { useCoachProducts } from "@/hooks/useStoreData";`
- Remove: `import { coaches } from "@/lib/mockData";` (line 10) -- no longer used anywhere
- Change toast import to sonner: `import { toast } from "sonner";` (line 9)

**2. Remove `getAllProducts` helper** (lines 49-57)
- Delete the entire function -- replaced by the hook

**3. Hook initialization (after line 74)**
- Add: `const { data: liveProducts, isLoading: productsLoading } = useCoachProducts();`
- Remove: `const allProducts = getAllProducts();` (line 76)

**4. Adapt `handleAddToCart`** (lines 107-143)
- The live product shape uses `image_url` not `image`, and `coach.full_name` not `coachName`
- Update field mappings in the `addToCart` call:
  - `image: product.image_url`
  - `coachName: product.coach?.full_name || "Koç"`
- Update discount key from `product.id + product.coachId` to `product.id + product.coach_id`

**5. Adapt `handleProductClick`** (line 102-105)
- Transform live product to the shape `ProductDetail` expects:
  - `image: product.image_url`
  - `coachName: product.coach?.full_name || "Koç"`
  - `coachId: product.coach_id`
  - `type: "product"`

**6. Store tab content (lines 415-476)**
- Add loading state: when `productsLoading`, render 4 skeleton cards in the 2-col grid (aspect-square skeleton + 3 text line skeletons)
- Replace `allProducts.map(...)` with `(liveProducts ?? []).map((product, index) => ...)`
- Update field references inside the map:
  - `product.image` → `product.image_url`
  - `product.coachName` → `product.coach?.full_name || "Koç"`
  - `product.coachId` → `product.coach_id`
  - Discount key: `product.id + product.coach_id`

### Files Changed
| File | Action |
|------|--------|
| `src/pages/Kesfet.tsx` | Edit imports, remove mock helpers, wire live hooks, update field mappings |

No new files. No database changes.

