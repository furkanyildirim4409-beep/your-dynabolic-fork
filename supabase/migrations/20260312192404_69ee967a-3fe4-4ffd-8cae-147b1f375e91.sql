
-- Create progress_photos table
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

-- Make progress-photos bucket public
UPDATE storage.buckets SET public = true WHERE id = 'progress-photos';

-- Storage RLS policies
CREATE POLICY "Users upload own progress photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own progress photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read progress photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'progress-photos');
