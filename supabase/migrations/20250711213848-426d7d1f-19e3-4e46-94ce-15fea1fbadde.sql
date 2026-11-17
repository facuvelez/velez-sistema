-- Delete existing admin user and profile completely
DELETE FROM public.profiles WHERE username = 'admin';
DELETE FROM auth.users WHERE email = 'admin@crm.local';

-- Create admin user with all required string fields set to empty strings
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token,
  email_change,
  phone,
  phone_change,
  phone_change_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@crm.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "admin"}',
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
);

-- Update the profile to have Administrator role
UPDATE public.profiles 
SET role = 'Administrator'::user_role 
WHERE username = 'admin';