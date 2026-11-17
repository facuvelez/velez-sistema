-- Update the profile to have Administrator role for the admin user
UPDATE public.profiles 
SET role = 'Administrator'::user_role 
WHERE username = 'admin';