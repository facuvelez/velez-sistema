-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the appointment reminder function to run every 15 minutes
SELECT cron.schedule(
  'appointment-reminders',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://bgblnidnbrnhimyunvia.supabase.co/functions/v1/appointment-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYmxuaWRuYnJuaGlteXVudmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MzcyMjgsImV4cCI6MjA2NzAxMzIyOH0.Jlo_4hPMz76r7slRonDMjbLJTSW6tU24NGc_7yDHT7Q"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);