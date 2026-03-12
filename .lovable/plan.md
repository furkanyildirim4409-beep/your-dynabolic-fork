

## Plan: Progress Photo Upload & Supabase Storage Integration

### 1. Database Migration — Create `progress_photos` table

```sql
CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  body_fat_pct numeric,
  note text,
  view text DEFAULT 'front',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own photos"
  ON public.progress_photos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete photos"
  ON public.progress_photos FOR SELECT TO authenticated
  USING (is_coach_of(user_id));
```

Also update the `progress-photos` storage bucket to **public** (it exists but is private), and add RLS on `storage.objects` so only the owner can upload/delete:

```sql
UPDATE storage.buckets SET public = true WHERE id = 'progress-photos';

CREATE POLICY "Users upload own progress photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own progress photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read progress photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'progress-photos');
```

### 2. Create `src/hooks/useProgressPhotos.ts`

- `fetchPhotos()`: queries `progress_photos` for current user, ordered by `date` asc
- `uploadPhoto(file, metadata)`: uploads file to `progress-photos/${user.id}/${timestamp}-${filename}`, gets public URL, inserts row into `progress_photos`
- `deletePhoto(id, url)`: removes storage object and DB row
- Returns `{ photos, loading, uploadPhoto, deletePhoto, refetch }`

### 3. Create `src/components/profile/UploadProgressPhotoModal.tsx`

- Dialog-based modal with:
  - Hidden `<input type="file" accept="image/*" capture="environment">` for camera/gallery
  - Image preview area with placeholder "Fotoğraf Seç veya Çek"
  - Fields: Date (defaults today), Weight (kg), Body Fat %, Note
  - "Yükle" button with loading spinner
  - On success: toast, refetch photos, close modal

### 4. Update `TransformationTimeline.tsx`

- Remove `mockPhotos` and `TransformationPhoto` interface entirely
- Import `useProgressPhotos` hook — use its `photos` array
- Add "+" button in header to open `UploadProgressPhotoModal`
- **Empty state** (photos.length === 0): show elegant card with Camera icon and "İlk gelişim fotoğrafınızı yükleyin" message + upload button
- **With photos**: feed real data into existing Timeline, Thumbnail strip, Compare modes — no watermark needed
- Guard compare mode: only show "Karşılaştır" button when photos.length >= 2
- Reset `compareRightIndex` to `photos.length - 1` when photos change

### Files
- **Migration**: new `progress_photos` table + storage policies
- **Create**: `src/hooks/useProgressPhotos.ts`
- **Create**: `src/components/profile/UploadProgressPhotoModal.tsx`
- **Modify**: `src/components/profile/TransformationTimeline.tsx`

