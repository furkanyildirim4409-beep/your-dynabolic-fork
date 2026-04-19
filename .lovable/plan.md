

## Plan: Part 8.2 Revised — Client-Side Hybrid Checkout

### Mimari Düzeltme Kabul
Edge function yaklaşımı iptal. Tüm Shopify Storefront API çağrıları **client-side** (`src/lib/shopify.ts`) içinden yapılacak. Token public Storefront token olduğu için bu güvenli ve standart pattern.

⚠️ **Geçiş notu:** Mevcut `supabase/functions/shopify-products/` edge function silinmeyecek (kullanıcı talimatına sadık kalıyoruz: "Do NOT create any Supabase Edge Functions" — silme değil, sadece yeni oluşturmama). Ama `src/lib/shopify.ts` bu function'ı çağırmaktan vazgeçip direkt Shopify'a fetch atacak. Bunun için **iki yeni env değişkeni gerekli olacak** (`VITE_SHOPIFY_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN`) — şu an sadece backend secret olarak ekli. Bunu plan sonunda kullanıcıya soracağım.

### Keşif (onay sonrası ilk iş)
- `src/pages/Kesfet.tsx` → "Mağaza" sekmesi şu an ne render ediyor? (mock array mı, başka hook mu?)
- Tab yapısı: Mağaza ana tab + alt-tab'lar (TAKVİYE/EKİPMAN) mı, yoksa düz iki ayrı tab mı?

### Step A — `src/lib/shopify.ts` genişlet

**1. `getProducts` opsiyonel query parametresi:**
```ts
export async function getProducts(opts: { limit?: number; query?: string } = {}): Promise<ShopifyProduct[]>
```
Default: `first: 50`, query yok → tüm ürünler. (Collection handle sonra eklenir, şimdilik query string ile filter, örn. `tag:supplement`.)

**2. Direkt client fetch'e geri dön:**
- `supabase.functions.invoke("shopify-products")` çağrısını kaldır.
- `shopifyFetch()` helper'ını canlandır (Part 8.1 plan taslağındaki gibi) → `https://${VITE_SHOPIFY_DOMAIN}/api/2024-10/graphql.json` direkt POST.

**3. Yeni fonksiyon: `createShopifyCart`:**
```ts
export async function createShopifyCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<string> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }`;
  const data = await shopifyFetch<{ cartCreate: { cart: { checkoutUrl: string }, userErrors: any[] } }>({
    query: mutation,
    variables: { input: { lines: lines.map(l => ({ merchandiseId: l.merchandiseId, quantity: l.quantity })) } },
  });
  if (data.cartCreate.userErrors?.length) throw new Error(data.cartCreate.userErrors[0].message);
  return data.cartCreate.cart.checkoutUrl;
}
```

### Step B — Mağaza tab'ını Shopify'a bağla
- `Kesfet.tsx` keşfinden sonra: ana "Mağaza" tab'ı `useShopifyProducts({ limit: 50 })` kullanır.
- TAKVİYE alt-tab'ı zaten `<SupplementShop />` (mevcut hook'u kullanıyor) — dokunulmaz.
- Genel mağaza için skeleton + error state aynı pattern.
- Kart UI: SupplementShop ile aynı stil (image, title, price, "SEPETE EKLE"). Yardımcı için inline render ya da paylaşılan `<ShopifyProductCard />` çıkarılabilir (keşif sonrası karar).

### Step C — `UniversalCartDrawer.tsx` Hibrit Orchestrator

**Cart split:**
```ts
const shopifyItems = items.filter(i => i.type === "supplement" || i.type === "product");
const coachingItems = items.filter(i => i.type === "coaching");
const isHybrid = shopifyItems.length > 0 && coachingItems.length > 0;
```

**UI eklemeler:**
- Hibrit ise sepet özetinin üstünde info banner:
  > *"Bu sepette 2 farklı ödeme akışı var. Koçluk ödemesi uygulama içinden, fiziksel ürün ödemesi Shopify üzerinden güvenle yapılacaktır."*
- BioCoin toggle'ının altına küçük not (Shopify item varsa):
  > *"Shopify ürünlerinde BioCoin kullanımı çok yakında (Part 8.3) aktif olacaktır."*
- BioCoin discount hesabı zaten coaching'i hariç tutuyor — şimdi tam tersi, **sadece coaching'e** uygulanmalı (Shopify ürünleri Shopify checkout'a gidecek, indirim kodu yok). `eligibleItems` filter'ını `i.type === "coaching"` olarak güncelle. (BioCoin kuralları memo'su `mem://features/biocoin-economy-ledger` revize edilecek.)

**Checkout orchestrator:**
```ts
const handleCheckout = async () => {
  // 1. Coaching varsa → native flow
  if (coachingItems.length > 0) {
    closeCart();
    setShowPaymentModal(true);
    // PaymentModal success → handlePaymentSuccess içinde Shopify redirect tetiklenir
    return;
  }
  // 2. Sadece Shopify ise → direkt redirect
  await redirectToShopifyCheckout();
};

const redirectToShopifyCheckout = async () => {
  if (shopifyItems.length === 0) return;
  try {
    const url = await createShopifyCart(
      shopifyItems.map(i => ({ merchandiseId: i.id, quantity: i.quantity }))
    );
    // Shopify item'larını sepetten temizle (coaching zaten Supabase'e yazıldı)
    shopifyItems.forEach(i => removeFromCart(i.id));
    window.location.href = url;
  } catch (err) {
    toast({ title: "Shopify checkout başarısız", description: err.message, variant: "destructive" });
  }
};
```

**`handlePaymentSuccess` güncelle:** coaching siparişini Supabase'e yazdıktan sonra, `shopifyItems.length > 0` ise `redirectToShopifyCheckout()` çağır.

### Step D — Runtime Hatası Düzeltmesi
Console'da görünen `Edge function returned 502: Error, {"error":""}` → mevcut `shopify-products` function 502 dönüyor çünkü secrets eksik veya domain hatalı. Step A'da client-side fetch'e geçince bu hata kendiliğinden çözülür (function artık çağrılmayacak).

### Step E — Env Değişkenleri (kullanıcıdan istenecek)
Build Secrets paneline (frontend için):
- `VITE_SHOPIFY_DOMAIN` (örn. `dynabolic-store.myshopify.com`)
- `VITE_SHOPIFY_STOREFRONT_TOKEN` (Storefront API public token)

Backend secret'lar (`SHOPIFY_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`) duruyor — ileride webhook/admin işlemleri için kalsın.

### Dosya Listesi

| Dosya | Aksiyon |
|------|--------|
| `src/lib/shopify.ts` | Direkt fetch'e dönüş + `getProducts({query})` + `createShopifyCart()` |
| `src/pages/Kesfet.tsx` | Mağaza tab'ı Shopify ürünleri (keşif sonrası netleşir) |
| `src/components/UniversalCartDrawer.tsx` | Hibrit orchestrator + BioCoin scope değişimi + UI disclaimer |
| `src/hooks/useStoreData.ts` | `useShopifyProducts` opsiyonel `query` parametresi |
| `mem://features/biocoin-economy-ledger` | "BioCoin sadece coaching'e uygulanır" güncellemesi |
| `mem://features/shopping-cart-system` | Hibrit checkout akışı eklenir |

**DB değişikliği yok. Yeni edge function yok.** Mevcut `shopify-products` edge function dormant kalır (silmiyoruz).

### Açık Soru (plan onayı sonrası kullanıcıya sorulacak)
Build Secrets'a `VITE_SHOPIFY_DOMAIN` ve `VITE_SHOPIFY_STOREFRONT_TOKEN` eklenmeli — değerler aynı backend secret'larıyla aynı mı, farklı mı?

