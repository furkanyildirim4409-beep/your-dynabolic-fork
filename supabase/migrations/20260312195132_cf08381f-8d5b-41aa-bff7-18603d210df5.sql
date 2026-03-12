
-- Create blood_tests table
CREATE TABLE public.blood_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  file_name text NOT NULL,
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  coach_notes text,
  extracted_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_tests ENABLE ROW LEVEL SECURITY;

-- Athletes manage their own blood tests
CREATE POLICY "Users manage own blood tests"
  ON public.blood_tests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches can view athlete blood tests
CREATE POLICY "Coaches can view athlete blood tests"
  ON public.blood_tests FOR SELECT TO authenticated
  USING (is_coach_of(user_id));

-- Create private storage bucket for blood test PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('blood-test-pdfs', 'blood-test-pdfs', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users upload own blood test pdfs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blood-test-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can view their own files
CREATE POLICY "Users view own blood test pdfs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blood-test-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can delete their own files
CREATE POLICY "Users delete own blood test pdfs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blood-test-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: coaches can view athlete files
CREATE POLICY "Coaches view athlete blood test pdfs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blood-test-pdfs' AND is_coach_of((storage.foldername(name))[1]::uuid));
