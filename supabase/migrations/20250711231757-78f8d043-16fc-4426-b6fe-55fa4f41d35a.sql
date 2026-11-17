-- Check if email confirmation is disabled
-- Update auth settings to disable email confirmation for testing
UPDATE auth.config 
SET raw_config = jsonb_set(
  raw_config,
  '{enable_signup,enable_email_confirmations}',
  'false'
) 
WHERE id = 'default';