

## Plan: Shopify Headless Integration — SupplementShop Live Data

### Tespit
- `SupplementShop.tsx` şu anda `shopSupplements` mock array'inden besleniyor (`src/lib/mockData.ts`).
- Projede Shopify SDK yok, native `fetch` ile Storefront API GraphQL çağrısı yapılacak (sıfır bağımlılık).
- BioCoin/flavor/sepet mantığı korunacak — sadece veri kaynağı değişecek.
- Lovable'ın dahili `shopify--enable` connector'ı VAR ama kullanıcı açıkça **headless Storefront API** istedi (kendi `VITE_SHOPIFY_DOMAIN` + token'ı ile). Bu yüzden enable flow'unu atlayıp doğrudan public Storefront API client kuruyoruz.

### Step A — `src/lib/shopify.ts` (yeni dosya)
Saf TypeScript GraphQL client:

```ts
const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2024-10";

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  price: number;
  currencyCode: string;
  variantId: string;
}

export async function shopifyFetch<T>({ query, variables }: { query: string; variables?: Record<string, any> }): Promise<T> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error("Shopify env vars missing: VITE_SHOPIFY_DOMAIN / VITE_SHOPIFY_STOREFRONT_TOKEN");
  }
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(json.errors?.[0]?.message ?? `Shopify API ${res.status}`);
  return json.data as T;
}

export async function getProducts(limit = 10): Promise<ShopifyProduct[]> {
  const query = `
    query Products($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) { edges { node { url altText } } }
            variants(first: 1) { edges { node { id price { amount currencyCode } } } }
          }
        }
      }
    }`;
  const data = await shopifyFetch<{ products: { edges: any[] } }>({ query, variables: { first: limit } });
  return data.products.edges.map(({ node }) => {
    const img = node.images.edges[0]?.node;
    const variant = node.variants.edges[0]?.node;
    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      description: node.description,
      imageUrl: img?.url ?? null,
      imageAlt: img?.altText ?? node.title,
      price: variant ? parseFloat(variant.price.amount) : 0,
      currencyCode: variant?.price.currencyCode ?? "TRY",
      variantId: variant?.id ?? "",
    };
  });
}
```

### Step B — `src/hooks/useStoreData.ts` (extend)
Yeni hook ekle, mevcut `useCoachProducts` korunur:

```ts
import { getProducts, ShopifyProduct } from "@/lib/shopify";
export function useShopifyProducts(limit = 20) {
  return useQuery<ShopifyProduct[]>({
    queryKey: ["shopify-products", limit],
    queryFn: () => getProducts(limit),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
```

### Step C — `src/components/SupplementShop.tsx` rewrite
- `shopSupplements` import'u kaldır.
- `useShopifyProducts()` çağır → loading: 6 adet `<Skeleton className="aspect-square">` grid; error: tek satır info card.
- Map Shopify product → mevcut kart UI'ı (image, title, price, BioCoin toggle, "SEPETE EKLE").
- `handleAddToCart` adapte: `addToCart({ id, title, price, image: imageUrl, type: "supplement", coachName: "Shopify" })`. Flavor/brand/category/rating UI'larını kaldır (Shopify temel sorgusunda yok — Part 8.2'de variant/metafield ile gelir).
- BioCoin %20 cap mantığı ve fiyat gösterimi aynen korunur.
- Currency: Shopify'dan gelen `currencyCode` ≠ TRY ise yine `₺` sembolüyle göster (ileride formatlanacak); şimdilik düz number.

### Step D — Env değişkenleri
Mesaj içinde kullanıcıya açıkça belirt:

> Lütfen aşağıdaki iki ortam değişkenini ayarla (Project Settings → Build Secrets ya da `.env`):
> - `VITE_SHOPIFY_DOMAIN` (örn. `dynabolic-store.myshopify.com`)
> - `VITE_SHOPIFY_STOREFRONT_TOKEN` (Shopify admin → Apps → Headless / Custom App → Storefront API access token)

`.env` dosyası secret yönetimi için kullanılmaz (Lovable kuralı), bu yüzden `.env.example` da oluşturmayız — değerler runtime'da `import.meta.env`'den okunur ve Build Secrets üzerinden inject edilir.

### Dosya Listesi

| Dosya | Aksiyon |
|------|--------|
| `src/lib/shopify.ts` | YENİ — GraphQL client + `getProducts()` |
| `src/hooks/useStoreData.ts` | `useShopifyProducts` hook'u eklenir |
| `src/components/SupplementShop.tsx` | Mock data sökülür, live Shopify data + skeleton/error state |

DB değişikliği yok. Mock `shopSupplements` array'i `mockData.ts` içinde dokunulmadan kalır (başka yerden import edilmiyorsa Part 8.x'te temizlenebilir).

