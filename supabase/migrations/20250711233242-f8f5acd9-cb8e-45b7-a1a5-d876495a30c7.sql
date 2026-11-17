-- Reset password for user Facu to a known password
-- First, let's update the encrypted_password directly
UPDATE auth.users 
SET encrypted_password = crypt('facu123', gen_salt('bf'))
WHERE email = 'facu@crm.app';