-- Drop all current policies for profiles
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow system profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all profile operations" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);