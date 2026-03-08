

# Daily Check-In → Supabase Bağlantısı

## Özet
`DailyCheckIn.tsx`'deki mock `setTimeout` kaldırılıp gerçek Supabase işlemleri eklenecek: `daily_checkins` tablosuna INSERT + `profiles.readiness_score` UPDATE.

## Veritabanı Durumu
- `daily_checkins` tablosu zaten mevcut (user_id, mood, sleep, soreness, stress, notes) — RLS policy "Users manage own checkins" var
- `profiles` tablosu `readiness_score` kolonu var — RLS policy "Users can update own profile" var
- **Yeni migration gerekmez** — tablolar ve policy'ler hazır

## Readiness Score Hesaplama
```
readiness = round(
  (mood * 0.25 + sleep * 0.35 + (10 - soreness) * 0.2 + (10 - stress) * 0.2) * 10
)
```
- Sleep en ağırlıklı (%35), mood %25, soreness ve stress ters orantılı (%20 each)
- Çıktı: 0–100 arası integer

## `DailyCheckIn.tsx` Değişiklikleri

1. **Import:** `supabase` client ve `useAuth` eklenir
2. **`handleSubmit` güncelleme:**
   - Mock `setTimeout` kaldırılır
   - `supabase.from('daily_checkins').insert(...)` ile check-in kaydedilir
   - `supabase.from('profiles').update({ readiness_score })` ile profil güncellenir
   - Hata durumunda sonner toast ile hata gösterilir
3. **Duplicate prevention:** `hasSubmittedToday` state + `daily_checkins` tablosunda bugünkü kaydı kontrol eden useEffect
4. **Toast:** Sonner `toast.success("Check-in tamamlandı! Koçuna iletildi.")` kullanılır (mevcut shadcn toast yerine)
5. **Submitted state:** Başarılı submit sonrası form yerine "Bugünkü check-in tamamlandı ✓" mesajı gösterilir

## Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| `src/components/DailyCheckIn.tsx` | Supabase entegrasyonu, readiness hesaplama, duplicate check |

