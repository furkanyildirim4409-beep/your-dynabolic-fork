

# Antrenman Sayfası — Gerçek Supabase Verisine Geçiş Planı

## Özet
`assignedWorkouts` mock verisini kaldırıp Supabase'den gerçek veri çeken bir `useAssignedWorkouts` hook'u oluşturulacak. Loading skeleton ve boş durum (Dinlenme Günü) UI'ı eklenecek.

---

## 1. RLS Policy Eklenmesi (Migration)
Mevcut durumda `programs` ve `exercises` tablolarında sadece koçlar SELECT yapabiliyor. Atletin joined query yapabilmesi için yeni RLS policy'leri gerekli:

```sql
-- Athletes can view programs assigned to them
CREATE POLICY "Athletes can view assigned programs"
ON public.programs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_workouts
    WHERE assigned_workouts.program_id = programs.id
      AND assigned_workouts.athlete_id = auth.uid()
  )
);

-- Athletes can view exercises of assigned programs
CREATE POLICY "Athletes can view assigned exercises"
ON public.exercises FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_workouts aw
    JOIN public.programs p ON p.id = aw.program_id
    WHERE p.id = exercises.program_id
      AND aw.athlete_id = auth.uid()
  )
);
```

## 2. `useAssignedWorkouts.ts` Hook Oluşturma
- `useAuth()` ile `user.id` alınacak
- `useQuery` (TanStack) ile Supabase sorgusu:
  ```ts
  supabase
    .from('assigned_workouts')
    .select('*, programs(*, exercises(*))')
    .eq('athlete_id', user.id)
    .eq('status', 'pending')
  ```
- Dönen veriyi `WorkoutCard` props formatına map eden transformer fonksiyonu:
  - `title` → `programs.title`
  - `exercises` → `programs.exercises.length`
  - `duration` → Egzersiz sayısına göre tahmini süre hesaplama (her egzersiz ~10dk)
  - `intensity` → `programs.difficulty` ("Düşük"/"Orta"/"Yüksek")
  - `day` → `scheduled_date` formatlanmış (date-fns ile Türkçe gün adı)
  - `coachNote` → `programs.description`
- Return: `{ workouts, isLoading, error }`

## 3. `Antrenman.tsx` Güncellemesi
- `assignedWorkouts` import'u kaldırılacak (mockData'dan sadece `workoutHistory` kalacak)
- `useAssignedWorkouts()` hook'u çağrılacak
- **Loading durumu:** 3 adet Skeleton card (glass-card içinde pulse animasyonlu)
- **Boş durum:** "Dinlenme Günü" empty state — büyük Coffee/Moon ikonu, motivasyon mesajı, koç iletişim butonu
- Workout count badge dinamik: `workouts.length` gösterilecek
- `onStart` callback'ında program exercises verisi de aktarılacak (VisionAI için)

## 4. Dosya Değişiklikleri

| Dosya | İşlem |
|---|---|
| Migration SQL | RLS policy ekleme (programs + exercises) |
| `src/hooks/useAssignedWorkouts.ts` | Yeni dosya — hook oluşturma |
| `src/pages/Antrenman.tsx` | Mock import kaldırma, hook entegrasyonu, skeleton + empty state |

