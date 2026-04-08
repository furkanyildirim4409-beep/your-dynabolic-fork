INSERT INTO public.auto_login_tokens (user_id, created_by, expires_at)
VALUES (
  '3e6d30af-eb09-485f-997e-35edc8e755cc',
  'c21a5a19-daaf-4e23-90f6-71179e7f8bcd',
  now() + interval '7 days'
);