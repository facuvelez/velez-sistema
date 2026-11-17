-- Fix critical employee information security vulnerability: Replace public access with self-access and admin management

-- Drop the dangerous "Allow all profile operations" policy
DROP POLICY IF EXISTS "Allow all profile operations" ON public.profiles;

-- Allow users to view and update their OWN profile only
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow Administrators full access to all profiles (needed for user management)
CREATE POLICY "Administrators can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'Administrator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'Administrator'
  )
);

-- Allow profile creation during user registration (system needs this)
CREATE POLICY "Allow profile creation on signup" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a security definer function to avoid recursion in admin policy
CREATE OR REPLACE FUNCTION public.is_administrator(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'Administrator'
  );
$$;

-- Replace admin policy with one using the security definer function
DROP POLICY IF EXISTS "Administrators can manage all profiles" ON public.profiles;

CREATE POLICY "Administrators can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (public.is_administrator(auth.uid()))
WITH CHECK (public.is_administrator(auth.uid()));