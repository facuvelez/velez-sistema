CREATE TABLE public.presupuestos_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cliente TEXT NOT NULL,
  vehiculo TEXT,
  generado_por UUID REFERENCES auth.users(id),
  generado_por_username TEXT
);

GRANT SELECT, INSERT ON public.presupuestos_log TO authenticated;
GRANT ALL ON public.presupuestos_log TO service_role;

ALTER TABLE public.presupuestos_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read presupuestos_log"
  ON public.presupuestos_log FOR SELECT
  USING (public.is_administrator(auth.uid()));

CREATE POLICY "Authenticated users can insert presupuestos_log"
  ON public.presupuestos_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);