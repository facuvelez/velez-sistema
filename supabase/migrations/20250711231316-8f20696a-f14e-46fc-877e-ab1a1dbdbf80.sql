-- Create admin user in Supabase Auth using service functions
-- This will create the user admin@example.com with password admin123

-- First, let's check if we can create a user profile for admin
-- Since we can't directly insert into auth.users, we'll create a placeholder in profiles
-- The admin user should be created manually in Supabase Dashboard

INSERT INTO public.profiles (user_id, username, role)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  'Administrator'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE username = 'admin'
);

-- Note: The actual auth user with email admin@example.com and password admin123
-- needs to be created manually in Supabase Dashboard -> Authentication -> Users
-- Then update this profile with the correct user_id