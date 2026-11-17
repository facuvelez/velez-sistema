-- Reset password for Facu with valid bcrypt hash
UPDATE auth.users
SET encrypted_password = crypt('bondiola25', gen_salt('bf')),
    updated_at = now()
WHERE email = 'facu@internal.app';

-- Clean up stale legacy duplicates that could cause confusion
DELETE FROM auth.users WHERE email IN ('facu@crm.app', 'facu_temp@crm.app');