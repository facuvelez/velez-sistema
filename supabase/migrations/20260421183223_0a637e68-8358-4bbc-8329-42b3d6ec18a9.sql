
-- 1. SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  default_discount_percent NUMERIC NOT NULL DEFAULT 0,
  default_freight_percent NUMERIC NOT NULL DEFAULT 0,
  categories TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Secretaries can manage suppliers"
ON public.suppliers
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. SUPPLIER_BRANDS
CREATE TABLE public.supplier_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  brand TEXT NOT NULL,
  category TEXT,
  vehicle_types TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_brands_supplier ON public.supplier_brands(supplier_id);
CREATE INDEX idx_supplier_brands_brand ON public.supplier_brands(brand);

ALTER TABLE public.supplier_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Secretaries can manage supplier brands"
ON public.supplier_brands
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE TRIGGER update_supplier_brands_updated_at
BEFORE UPDATE ON public.supplier_brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. SUPPLIER_PURCHASES
CREATE TABLE public.supplier_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  purchase_date DATE NOT NULL,
  invoice_number TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_purchases_supplier ON public.supplier_purchases(supplier_id);
CREATE INDEX idx_supplier_purchases_date ON public.supplier_purchases(purchase_date DESC);

ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Secretaries can manage supplier purchases"
ON public.supplier_purchases
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE TRIGGER update_supplier_purchases_updated_at
BEFORE UPDATE ON public.supplier_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. SUPPLIER_PURCHASE_ITEMS
CREATE TABLE public.supplier_purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL,
  brand TEXT,
  category TEXT,
  vehicle_type TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  list_price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  freight_percent NUMERIC NOT NULL DEFAULT 0,
  final_unit_cost NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_items_purchase ON public.supplier_purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_brand ON public.supplier_purchase_items(brand);

ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Secretaries can manage purchase items"
ON public.supplier_purchase_items
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));
