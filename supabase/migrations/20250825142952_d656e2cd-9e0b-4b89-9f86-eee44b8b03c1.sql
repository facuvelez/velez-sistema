-- Fix critical security vulnerability: Replace public access with role-based access control for clients table

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public access to clients" ON public.clients;

-- Create secure RLS policies for the clients table based on user roles

-- Allow Administrators and Secretaries full access to client data
CREATE POLICY "Administrators and Secretaries can manage clients" 
ON public.clients 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('Administrator', 'Secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('Administrator', 'Secretary')
  )
);

-- Allow Operators read-only access to client data (they may need to view clients for their work)
CREATE POLICY "Operators can view clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'Operator'
  )
);

-- Create security definer function to avoid RLS recursion issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Replace the policies with ones using the security definer function for better performance
DROP POLICY IF EXISTS "Administrators and Secretaries can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Operators can view clients" ON public.clients;

CREATE POLICY "Administrators and Secretaries can manage clients" 
ON public.clients 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

CREATE POLICY "Operators can view clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'Operator');