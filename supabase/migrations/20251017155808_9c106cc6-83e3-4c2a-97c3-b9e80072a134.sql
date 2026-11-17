-- Update RLS policies for appointments to allow Alineador full access
DROP POLICY IF EXISTS "Operators can view appointments" ON public.appointments;

-- Operators can view appointments
CREATE POLICY "Operators can view appointments" 
ON public.appointments 
FOR SELECT 
USING (get_current_user_role() = 'Operator'::user_role);

-- Alineadores can manage appointments (full access like Admin/Secretary)
CREATE POLICY "Alineadores can manage appointments" 
ON public.appointments 
FOR ALL 
USING (get_current_user_role() = 'Alineador'::user_role)
WITH CHECK (get_current_user_role() = 'Alineador'::user_role);