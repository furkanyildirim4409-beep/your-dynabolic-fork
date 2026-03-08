
-- Bio-Coin transaction log table
CREATE TABLE public.bio_coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add comment for clarity
COMMENT ON COLUMN public.bio_coin_transactions.amount IS 'Positive = earned, Negative = spent';
COMMENT ON COLUMN public.bio_coin_transactions.type IS 'workout, challenge, purchase, bonus';

-- Enable RLS
ALTER TABLE public.bio_coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own transactions
CREATE POLICY "Users can view own transactions"
ON public.bio_coin_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own transactions
CREATE POLICY "Users can insert own transactions"
ON public.bio_coin_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Coaches can view athlete transactions
CREATE POLICY "Coaches can view athlete transactions"
ON public.bio_coin_transactions FOR SELECT TO authenticated
USING (public.is_coach_of(user_id));
