-- Morning check-in nudge at 09:00 Istanbul time (06:00 UTC)
SELECT cron.schedule(
  'daily-checkin-nudge',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fsbhbfltathfcpvcjfzt.supabase.co/functions/v1/send-scheduled-reminders?type=checkin',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYmhiZmx0YXRoZmNwdmNqZnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzY0MzgsImV4cCI6MjA4ODU1MjQzOH0.nRfgLU4qfAWe_qfy9-X4sUrVSHptH3wPWEeI_ZgyST4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Evening workout reminder at 18:00 Istanbul time (15:00 UTC)
SELECT cron.schedule(
  'daily-workout-reminder',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fsbhbfltathfcpvcjfzt.supabase.co/functions/v1/send-scheduled-reminders?type=workout',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYmhiZmx0YXRoZmNwdmNqZnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzY0MzgsImV4cCI6MjA4ODU1MjQzOH0.nRfgLU4qfAWe_qfy9-X4sUrVSHptH3wPWEeI_ZgyST4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);