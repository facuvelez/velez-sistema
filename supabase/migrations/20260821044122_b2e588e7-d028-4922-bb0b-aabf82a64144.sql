ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS province TEXT;

CREATE TABLE public.supplier_excel_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  column_medida TEXT,
  column_codigo TEXT,
  column_descripcion TEXT,
  column_precio TEXT NOT NULL,
  header_row INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (supplier_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_excel_templates TO authenticated;
GRANT ALL ON public.supplier_excel_templates TO service_role;

ALTER TABLE public.supplier_excel_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Administracion can manage excel templates"
ON public.supplier_excel_templates
FOR ALL
TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]))
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]));

CREATE INDEX idx_excel_templates_supplier ON public.supplier_excel_templates(supplier_id);

CREATE TRIGGER update_excel_templates_updated_at
BEFORE UPDATE ON public.supplier_excel_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();