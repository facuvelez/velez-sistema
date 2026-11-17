CREATE TABLE public.alineador_vacaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_username TEXT,
  CONSTRAINT fechas_validas CHECK (fecha_hasta >= fecha_desde)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alineador_vacaciones TO authenticated;
GRANT ALL ON public.alineador_vacaciones TO service_role;

ALTER TABLE public.alineador_vacaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read vacaciones"
  ON public.alineador_vacaciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage vacaciones"
  ON public.alineador_vacaciones FOR ALL
  USING (public.get_current_user_role() IN ('Administrator', 'Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Administracion'));