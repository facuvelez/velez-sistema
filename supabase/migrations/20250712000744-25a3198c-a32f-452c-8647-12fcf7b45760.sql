-- Confirm email for the user Facu
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'facu_1752278188684@internal.app';