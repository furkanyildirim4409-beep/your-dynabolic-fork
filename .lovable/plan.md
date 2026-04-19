

## Tespit edilen iki kök neden (DB ile doğrulandı)

Mevcut koç (`c21a5a19...`) için `coach_stories` tablosunda 4 satır var:

| id | category | is_highlighted | expires_at | Durum |
|----|----------|---------------|-----------|-------|
| d011… | Değişimler | true | gelecek | aktif |
| 7cd4… | NULL | false | gelecek | sadece 24h |
| 50ce… | Değişimler | true | **geçmiş** | **arşivden öne çıkarılmış** |
| 3567… | Soru-Cevap | false | geçmiş | arşiv |

### Kök neden #1 — RLS arşivlenmiş highlight'ları engelliyor
`coach_stories` üzerindeki public SELECT policy:
```
"Herkes aktif hikayeleri görebilir": USING (now() < expires_at)
```
24 saati dolmuş highlight kayıtlar (50ce…) athlete app tarafından **hiç okunamıyor**. Hook ne yazarsa yazsın RLS blokluyor. Koç panelinde görünüyor çünkü panel kendi koç session'ı ile "Coaches can view own stories" policy'sini kullanıyor.

### Kök neden #2 — `CoachProfile.tsx` highlight'ı iki kez render ediyor
`src/pages/CoachProfile.tsx` satır 299–327'de **iki ayrı highlight bloğu** mevcut:
1. İnline "ÖNE ÇIKANLAR" bölümü (satır 299–324) — `useCoachHighlights` + `handleHighlightClick`.
2. `<CoachHighlightsRow coachId={coachId} />` (satır 327) — aynı hook'u tekrar çağırıyor ve aynı verileri tekrar çiziyor.

Bu yüzden ekranda her bucket iki kez görünüyor.

## Düzeltme planı

### A) DB migration — RLS policy'yi highlight için aç
`coach_stories` tablosunun public SELECT politikasını şöyle değiştir:
```sql
DROP POLICY "Herkes aktif hikayeleri görebilir" ON public.coach_stories;

CREATE POLICY "Public can view active or highlighted stories"
ON public.coach_stories
FOR SELECT
TO public
USING (
  now() < expires_at
  OR is_highlighted = true
  OR category IS NOT NULL
);
```
Böylece:
- Aktif 24h ring davranışı korunur (`useCoachSpecificStories` yine `.gt('expires_at', now)` filtresi koyuyor → ring asla highlight göstermez).
- Highlight bucket'ı geçmiş kayıtları da okuyabilir.

### B) `src/pages/CoachProfile.tsx` — duplicate render'ı sil
Satır 299–324 arasındaki inline "ÖNE ÇIKANLAR" bloğunu **tamamen kaldır**. Yalnızca `<CoachHighlightsRow coachId={coachId} />` kalsın. Artık ihtiyaç kalmadığı için `highlights`, `highlightsLoading`, `useCoachHighlights`, `handleHighlightClick`, `CoachHighlight` ve `Skeleton` import'larındaki kullanımları temizle (Skeleton başka yerde de kullanılıyor, sadece highlight kullanımını kaldır).

### C) `CoachHighlightsRow.tsx` — başlık ekle (UX paritesi için)
Silinen inline blokta görünen "ÖNE ÇIKANLAR" başlığı kayboldu; aynı tipografide tek satırlık başlığı `CoachHighlightsRow`'un üstüne ekle.

### D) Memory güncelle
`mem://features/coach-story-highlights` notuna RLS sözleşmesini ekle: "public SELECT artık `now() < expires_at OR is_highlighted = true OR category IS NOT NULL`". 24h ring `useCoachSpecificStories` içindeki `.gt(expires_at, now)` ile zorlanır.

## Dosya listesi

| Dosya | Aksiyon |
|------|--------|
| Yeni migration | `coach_stories` SELECT policy'sini yeniden yaz |
| `src/pages/CoachProfile.tsx` | İnline highlight bloğunu sil, kullanılmayan import/handler'ları temizle |
| `src/components/CoachHighlightsRow.tsx` | "ÖNE ÇIKANLAR" başlığı ekle |
| `mem://features/coach-story-highlights` | RLS kontratını yansıt |

Koç paneli tarafında değişiklik gerekmiyor — `useUpdateStoryCategory` zaten `is_highlighted=true` ve `category` alanlarını UPDATE ile doğru yazıyor, INSERT yapmıyor.

