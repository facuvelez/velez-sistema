CREATE TABLE public.supplier_category_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  brand TEXT,
  discount_percent_1 NUMERIC NOT NULL DEFAULT 0,
  discount_percent_2 NUMERIC,
  discount_percent_3 NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_category_discounts TO authenticated;
GRANT ALL ON public.supplier_category_discounts TO service_role;

ALTER TABLE public.supplier_category_discounts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX supplier_category_discounts_unique
  ON public.supplier_category_discounts (supplier_id, category, COALESCE(brand, ''));

CREATE INDEX supplier_category_discounts_supplier_idx
  ON public.supplier_category_discounts (supplier_id);

CREATE POLICY "Admins manage supplier category discounts"
ON public.supplier_category_discounts
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('Administrator'::user_role, 'Administracion'::user_role))
WITH CHECK (public.get_current_user_role() IN ('Administrator'::user_role, 'Administracion'::user_role));

CREATE TRIGGER update_supplier_category_discounts_updated_at
BEFORE UPDATE ON public.supplier_category_discounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.suppliers
  DROP COLUMN IF EXISTS default_discount_percent,
  DROP COLUMN IF EXISTS discount_percent_2,
  DROP COLUMN IF EXISTS default_freight_percent;