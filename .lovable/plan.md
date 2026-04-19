

## Tespit (DB ile doğrulandı)

**Network log**: `GET /coach_highlight_metadata?coach_id=eq.c21a5a19...` → `200 []` (boş dizi).

**DB sorgusu**: Aynı satır gerçekte mevcut:
```
category_name = 'Değişimler'
custom_cover_url = .../highlight-covers/c21a5a19.../2f600872-...jpg
```

**RLS policy listesi** (`coach_highlight_metadata`):
```
"Coaches manage own highlight metadata"  ALL  USING (auth.uid() = coach_id)
```
Tek policy bu. Yani sadece koçun kendisi okuyabiliyor — sporcu profili ziyaret ettiğinde RLS satırı filtreliyor ve boş dönüyor. Hook sessizce `stories[0].media_url`'e düşüyor → koçun manuel olarak kırptığı kapak athlete app'te asla görünmüyor.

Coach Panel tarafı ise doğru çalışıyor:
- `HighlightCoverCropper` → `social-media` bucket'a yüklüyor (public, OK)
- `useUpsertHighlightMetadata` → `coach_highlight_metadata`'ya `coach_id + category_name + custom_cover_url` UPSERT'liyor (kendi coach session'ı ile policy geçiyor)
- Hook'lar (`useCoachHighlights` panel tarafı) custom cover'ı doğru gösteriyor

Sorun **sadece** athlete app okuma yetkisinde.

## Düzeltme planı

### A) DB migration — public SELECT policy ekle

`coach_highlight_metadata` non-sensitive: yalnızca koç ID + kategori adı + halka açık `social-media` bucket URL'i içeriyor (zaten public bucket). Tıpkı `coach_stories` ve `coach_products` gibi public okumaya açılmalı.

```sql
CREATE POLICY "Public can view highlight metadata"
ON public.coach_highlight_metadata
FOR SELECT
TO public
USING (true);
```

Mevcut `ALL` policy korunur (yazma yetkisi sadece koça ait kalır). Athlete app artık `category_name` + `custom_cover_url` çiftini okuyabilecek.

### B) Frontend doğrulaması — değişiklik gerekmiyor

`src/hooks/useCoachDetail.ts` içindeki `useCoachHighlights` zaten:
- `coach_highlight_metadata`'yı paralel fetch'liyor
- Türkçe locale uppercase + whitespace-strip ile normalize key map kuruyor (`Değişimler` → `DEĞİŞİMLER`)
- `cover = metaMap.get(key) ?? stories[0].media_url` fallback ile çözüyor

RLS açıldığı an athlete koçun kırptığı dairesel kapağı anında görecek; fallback yalnızca metadata yoksa devreye girecek.

### C) Memory güncelle

`mem://features/coach-story-highlights` notuna ek:
> `coach_highlight_metadata` public SELECT açıktır (`USING (true)`); yazma `auth.uid() = coach_id` ile koça kilitlidir. Athlete profili ziyaret ettiğinde koçun custom cropped kapağını okuyabilmek için zorunludur.

## Dosya listesi

| Dosya | Aksiyon |
|------|--------|
| Yeni migration | `coach_highlight_metadata` üzerine `Public can view highlight metadata` SELECT policy ekle |
| `mem://features/coach-story-highlights` | RLS kontratını güncelle |

Frontend (athlete app) ve Coach Panel kodunda **hiçbir değişiklik gerekmiyor** — sorun saf RLS engelleme. Migration uygulandığı an, koçun panelden atadığı dairesel kapaklar `/coach/:id` sayfasındaki "ÖNE ÇIKANLAR" satırında doğrudan görünür hâle gelecek.

