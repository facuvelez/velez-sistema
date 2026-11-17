-- Reset password for Facu with a valid bcrypt hash (legacy hash was truncated)
UPDATE auth.users
SET encrypted_password = crypt('bondiola25', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'facu@internal.app';

-- Clean up stale legacy duplicates that might still exist
DELETE FROM auth.users WHERE email IN ('facu@crm.app', 'facu_temp@crm.app');