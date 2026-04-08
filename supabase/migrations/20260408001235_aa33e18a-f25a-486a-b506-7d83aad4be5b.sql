
-- Auto-login tokens table
CREATE TABLE public.auto_login_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_auto_login_tokens_token ON public.auto_login_tokens(token);

-- Enable RLS
ALTER TABLE public.auto_login_tokens ENABLE ROW LEVEL SECURITY;

-- Coaches can create tokens for their athletes
CREATE POLICY "Coaches can create tokens for their athletes"
ON public.auto_login_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    user_id = auth.uid()
    OR public.is_coach_of(user_id)
  )
);

-- Users can view tokens they created
CREATE POLICY "Users can view their created tokens"
ON public.auto_login_tokens
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Cleanup function for expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_auto_login_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.auto_login_tokens
  WHERE expires_at < now() OR used_at IS NOT NULL;
$$;
