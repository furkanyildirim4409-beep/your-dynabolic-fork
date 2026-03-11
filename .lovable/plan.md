

## Dijital İkiz Kamera Uzaklaştırma

Mevcut kamera ayarları modelin tamamını gösteremiyor. Şu değişiklikler yapılacak:

### `src/components/RealisticBodyAvatar.tsx`

1. **Container yüksekliği**: `h-[520px]` → `h-[600px]` — daha fazla dikey alan
2. **Kamera pozisyonu**: `position: [0, 0.35, 5.5]` → `[0, 0.3, 7]` — daha uzak
3. **FOV**: `48` → `52` — daha geniş görüş açısı
4. **OrbitControls**: `minDistance: 4` → `5`, `maxDistance: 7` → `10` — zoom aralığı genişletilir
5. **Kamera Y offset**: `0.35` → `0.3` — modeli dikeyde daha iyi ortalar (kafa + ayak eşit mesafe)

Bu değişikliklerle kafa ve ayaklar aynı anda rahatça görünecek.

