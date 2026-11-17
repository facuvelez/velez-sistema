-- Update admin user email and role
UPDATE auth.users 
SET email = 'admin@crm.app'
WHERE email = 'admin@crm.local';

-- Update admin role to Administrator
UPDATE public.profiles 
SET role = 'Administrator'::user_role
WHERE username = 'admin';