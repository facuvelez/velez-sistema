-- Create security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Administrators can view all profiles" ON public.profiles
  FOR SELECT  
  USING (public.get_current_user_role() = 'Administrator' OR auth.uid() = user_id);

CREATE POLICY "Administrators can insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'Administrator');

CREATE POLICY "Administrators can update profiles" ON public.profiles
  FOR UPDATE
  USING (public.get_current_user_role() = 'Administrator');

CREATE POLICY "Administrators can delete profiles" ON public.profiles
  FOR DELETE
  USING (public.get_current_user_role() = 'Administrator');