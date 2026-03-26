
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS opponent_proof_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-proofs', 'challenge-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload challenge proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-proofs');

CREATE POLICY "Anyone can view challenge proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'challenge-proofs');
