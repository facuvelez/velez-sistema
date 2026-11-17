DROP POLICY IF EXISTS "Admins can read presupuestos_log" ON public.presupuestos_log;

CREATE POLICY "Admins can read presupuestos_log"
  ON public.presupuestos_log FOR SELECT
  USING (
    public.get_current_user_role() IN ('Administrator', 'Administracion')
  );