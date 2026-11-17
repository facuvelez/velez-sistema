DROP POLICY IF EXISTS "Alineador can read clients" ON public.clients;

CREATE POLICY "Alineador can read clients"
  ON public.clients FOR SELECT
  USING (
    public.get_current_user_role() IN ('Administrator', 'Administracion', 'Alineador')
  );