-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Administrators can insert profiles" ON public.profiles;

-- Create a new policy that allows inserting during user creation
CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Also create a policy that allows the trigger to insert
CREATE POLICY "Allow system profile creation" 
ON public.profiles 
FOR INSERT 
TO public 
WITH CHECK (true);