-- Create a function that allows administrators to fetch all profiles
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text,
    role user_role,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, user_id, username, role, created_at, updated_at 
    FROM public.profiles 
    ORDER BY created_at DESC;
$$;

-- Update RLS policy to allow the security definer function to work
CREATE POLICY "Allow admin function to access all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Grant execute permission to authenticated users (the function will handle admin check)
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO anon;