ALTER TABLE public.challenge_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.challenge_messages ADD COLUMN IF NOT EXISTS media_type TEXT;