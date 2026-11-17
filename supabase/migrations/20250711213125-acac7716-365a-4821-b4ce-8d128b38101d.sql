-- Delete existing admin user and profile completely
DELETE FROM public.profiles WHERE username = 'admin';
DELETE FROM auth.users WHERE email = 'admin@crm.local';

-- Create admin user with basic required fields
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
  confirmed_at
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
  now()
);