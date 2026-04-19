

## Plan: BioCoin Rule Engine Overhaul + Supplement Tab Restoration

### Tespit
- `Kesfet.tsx` Mağaza sekmesi var ama "Supplementler" sekmesi yok. `<SupplementShop />` bileşeni mevcut (`shopSupplements` mock data ile), hiçbir yerden import edilmiyor.
- `UniversalCartDrawer.tsx`'te BioCoin mantığı sabit `100 coin = 50₺` flat indirim. Sepet türünden (coaching dahil) bağımsız uygulanıyor — kural ihlali.
- `CartItem.type` union: `"product" | "supplement" | "coaching"`. Eligible türler: `product` ve `supplement`. Coaching hariç.

### Step A — Supplement sekmesi geri ekle (`src/pages/Kesfet.tsx`)
- `TabsList`'i 3 → 4 kolona çıkar (`grid-cols-4`).
- Yeni `TabsTrigger value="supplements"` → "TAKVİYE" başlığı.
- Yeni `TabsContent value="supplements"` → `<SupplementShop />` render eder.
- Üst kısma `import SupplementShop from "@/components/SupplementShop"`.
- Mevcut tema (`glass-card`, primary lime) zaten `SupplementShop` içinde uygulanmış, ek stil gerekmez.

### Step B — Cart Rule Engine (`src/components/UniversalCartDrawer.tsx`)
Eski `COIN_DISCOUNT_THRESHOLD/AMOUNT` flat sabitleri kaldırılır. Yeni saf hesaplama:

```ts
const COIN_TO_TL = 1;            // 1 BioCoin = 1 TL
const MAX_PCT = 0.20;            // %20 cap

// Eligible items only (coaching hariç)
const eligibleItems = items.filter(i => i.type !== "coaching");
const eligibleSubtotal = eligibleItems.reduce((s, i) => s + i.price * i.quantity, 0);

const maxDiscountTL = Math.floor(eligibleSubtotal * MAX_PCT);
const maxCoinsUsable = Math.min(balance, Math.floor(maxDiscountTL / COIN_TO_TL));
const coinDiscount = useCoinDiscount ? maxCoinsUsable * COIN_TO_TL : 0;
const finalTotal = Math.max(0, cartTotal - coinDiscount);

const onlyCoaching = items.length > 0 && eligibleItems.length === 0;
const canUseCoinDiscount = !onlyCoaching && balance > 0 && maxDiscountTL > 0;
```

Doğrulama: 1000₺ supplement + 5000₺ coaching → eligibleSubtotal=1000, maxDiscountTL=200, kullanıcı yeterli coin'e sahipse tam 200₺ indirim, coaching dokunulmaz. ✓

### Step C — UI Geri Bildirim (aynı dosya)
BioCoin bloğu yeniden tasarlanır:

1. **Aktif kart** (`canUseCoinDiscount` true):
   - Başlık: "BİOCOİN İNDİRİMİ"
   - Alt satır: `"Maks. indirim: {maxDiscountTL}₺ ({maxCoinsUsable} coin) · Koçluk paketleri hariç"`
   - Switch açıkken: "Bakiye: {balance} coin" + "-{coinDiscount}₺"
2. **Sadece coaching durumu** (`onlyCoaching` true):
   - Switch disabled, küçük info satırı: *"BioCoin indirimi koçluk paketlerinde geçerli değildir."*
3. Order kaydında `total_coins_used = coinDiscount / COIN_TO_TL` (yani gerçekte kullanılan coin sayısı), `spendCoins(maxCoinsUsable, ...)` çağrılır.

### Step D — Memory güncelle
`mem://features/biocoin-economy-ledger` notu güncellenir:
> Yeni kural: 1 BioCoin = 1 TL. Sepetteki **eligible** (`product` + `supplement`) ürünlerin toplamının maksimum **%20**'sine kadar indirim. `coaching` türü daima hariç. Sadece coaching içeren sepette toggle disabled.

### Dosya Listesi

| Dosya | Aksiyon |
|------|--------|
| `src/pages/Kesfet.tsx` | 4. tab "TAKVİYE" + `<SupplementShop />` mount |
| `src/components/UniversalCartDrawer.tsx` | Flat threshold mantığını sil, rule engine + UI badge + disabled state |
| `mem://features/biocoin-economy-ledger` | Yeni kural setini yansıt |

DB değişikliği yok. `CartContext` API'si (items, balance) zaten yeterli — context'e dokunulmaz, hesaplama drawer içinde kalır (yalnızca tüketici drawer olduğu için).

