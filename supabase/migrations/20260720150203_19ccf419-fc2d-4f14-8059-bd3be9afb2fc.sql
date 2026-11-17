DROP POLICY IF EXISTS "Users can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can read appointments" ON public.appointments;

CREATE POLICY "All authenticated can read appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() IS NOT NULL);