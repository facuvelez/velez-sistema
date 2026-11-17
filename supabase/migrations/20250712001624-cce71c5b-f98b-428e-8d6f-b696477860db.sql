-- Confirm email for user Abel
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'abel_1752279314559@internal.app';