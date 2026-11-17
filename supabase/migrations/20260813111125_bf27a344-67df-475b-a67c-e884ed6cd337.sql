ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS discount_percent_2 NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE public.supplier_price_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_brand_id UUID NOT NULL REFERENCES public.supplier_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vehicle_type TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_price_lists TO authenticated;
GRANT ALL ON public.supplier_price_lists TO service_role;

ALTER TABLE public.supplier_price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Administracion can manage price lists"
ON public.supplier_price_lists
FOR ALL
TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]))
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]));

CREATE INDEX idx_price_lists_brand ON public.supplier_price_lists(supplier_brand_id);

CREATE TRIGGER update_price_lists_updated_at
BEFORE UPDATE ON public.supplier_price_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.supplier_price_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_list_id UUID NOT NULL REFERENCES public.supplier_price_lists(id) ON DELETE CASCADE,
  medida TEXT,
  codigo TEXT,
  descripcion TEXT,
  precio NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_price_list_items TO authenticated;
GRANT ALL ON public.supplier_price_list_items TO service_role;

ALTER TABLE public.supplier_price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Administracion can manage price list items"
ON public.supplier_price_list_items
FOR ALL
TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]))
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]));

CREATE INDEX idx_price_list_items_list ON public.supplier_price_list_items(price_list_id);
CREATE INDEX idx_price_list_items_codigo ON public.supplier_price_list_items(codigo);
CREATE INDEX idx_price_list_items_medida ON public.supplier_price_list_items(medida);