-- Create default admin user
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
  aud
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
  'authenticated'
);

-- The profile will be automatically created by the trigger we set up previously