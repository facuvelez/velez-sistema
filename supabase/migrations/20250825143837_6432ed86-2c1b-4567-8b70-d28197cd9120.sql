-- Fix critical financial data security vulnerability: Replace public access with role-based access control

-- Fix CHEQUES table - highly sensitive bank and payment data
DROP POLICY IF EXISTS "Public access to cheques" ON public.cheques;

CREATE POLICY "Administrators and Secretaries can manage cheques" 
ON public.cheques 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

-- Operators should NOT have access to cheque details (bank info, amounts)
-- No read policy for Operators on cheques table

-- Fix SERVICES table - contains business operations and pricing data
DROP POLICY IF EXISTS "Public access to services" ON public.services;

CREATE POLICY "Administrators and Secretaries can manage services" 
ON public.services 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

-- Operators can view services but with limited access (they need this for their work)
CREATE POLICY "Operators can view services" 
ON public.services 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'Operator');

-- Fix DEBTS table - contains sensitive client financial obligations
DROP POLICY IF EXISTS "Public access to debts" ON public.debts;

CREATE POLICY "Administrators and Secretaries can manage debts" 
ON public.debts 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

-- Operators should NOT have direct access to debt details
-- No read policy for Operators on debts table

-- Fix DEBT_PAYMENTS table - contains sensitive payment history
DROP POLICY IF EXISTS "Public access to debt_payments" ON public.debt_payments;

CREATE POLICY "Administrators and Secretaries can manage debt payments" 
ON public.debt_payments 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

-- Operators should NOT have access to payment details
-- No read policy for Operators on debt_payments table

-- Fix APPOINTMENTS table for consistency (already had proper policies but let's ensure they're secure)
DROP POLICY IF EXISTS "Appointments are viewable by everyone" ON public.appointments;
DROP POLICY IF EXISTS "Appointments can be created by everyone" ON public.appointments;  
DROP POLICY IF EXISTS "Appointments can be updated by everyone" ON public.appointments;
DROP POLICY IF EXISTS "Appointments can be deleted by everyone" ON public.appointments;

CREATE POLICY "Administrators and Secretaries can manage appointments" 
ON public.appointments 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() IN ('Administrator', 'Secretary'))
WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Secretary'));

CREATE POLICY "Operators can view appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'Operator');