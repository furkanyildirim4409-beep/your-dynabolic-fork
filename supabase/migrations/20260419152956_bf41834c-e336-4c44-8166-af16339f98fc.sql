-- Helper index for follower counts
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_id ON public.user_follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON public.profiles(coach_id);

-- Trigger function: on paid coaching order, link athlete -> coach
CREATE OR REPLACE FUNCTION public.handle_coaching_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_coach_id uuid;
BEGIN
  -- Only act when status transitions to 'paid'
  IF NEW.status IS DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR NEW.items IS NULL THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    IF (item->>'type') = 'coaching' OR (item->>'item_type') = 'coaching' THEN
      v_coach_id := NULLIF(item->>'coach_id', '')::uuid;
      IF v_coach_id IS NOT NULL THEN
        UPDATE public.profiles
        SET coach_id = v_coach_id,
            updated_at = now()
        WHERE id = NEW.user_id
          AND (coach_id IS NULL OR coach_id <> v_coach_id);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_coaching_order_paid ON public.orders;
CREATE TRIGGER trg_handle_coaching_order_paid
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_coaching_order_paid();