-- Confirm email for existing users so they can login
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;