
Sorun tespiti
- Sorun frontend’de değil, canlı Supabase RLS konfigürasyonunda.
- `EditProfileDialog.tsx` zaten `phone_number` alanını PATCH body içinde gönderiyor.
- Network snapshot’ta istek gövdesi doğru görünüyor: `{"full_name":"...","phone_number":"..."}`
- Ancak hemen sonraki GET cevabı ve doğrudan DB sorgusu hâlâ `phone_number = null` dönüyor.
- Canlı `public.profiles` politikalarında kullanıcıların kendi profilini güncellemesini sağlayan `UPDATE` policy eksik. Şu an sadece coach/team update policy’leri var.
- Sonuç: istek hata vermeden 0 satır etkiliyor, UI de bunu yanlışlıkla “başarılı” sanıyor.

Uygulama planı
1. `supabase/migrations/` altına yeni bir migration ekleyip `public.profiles` için kullanıcıya kendi satırını güncelleme yetkisini geri yükle:
```sql
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

2. `src/components/EditProfileDialog.tsx` içinde sessiz başarısızlığı engelle:
- `.update(...)` sonrasına `.select("id, phone_number").single()` ekle
- Dönen satır yoksa hata fırlat
- Sadece gerçek update olursa başarı toast’ı göster

3. `AuthContext.tsx` ve mevcut `phone_number` mapping’ine dokunma:
- `phone_number` tipi zaten mevcut
- `fetchProfile()` zaten `select("*")` ile alanı alıyor
- Asıl kırık nokta yazma izni

Doğrulama
- Profil düzenleden telefon numarası kaydet
- PATCH sonrası GET cevabında `phone_number` dolu gelsin
- Sayfayı yenile
- “Profili Düzenle” dialog’unu tekrar aç
- Input içinde kayıtlı numara otomatik görünsün
- DB’de ilgili `profiles.phone_number` alanı dolu olsun

Teknik not
- Bu bir state senkronizasyon problemi değil, canlı DB’de RLS drift problemi.
- `profiles` PII içerdiği için geniş erişim açılmayacak; sadece giriş yapmış kullanıcının kendi kaydını update etmesi geri eklenecek.
