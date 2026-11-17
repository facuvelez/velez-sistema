
CREATE POLICY "Allow anon access to suppliers"
ON public.suppliers FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to supplier_brands"
ON public.supplier_brands FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to supplier_purchases"
ON public.supplier_purchases FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to supplier_purchase_items"
ON public.supplier_purchase_items FOR ALL TO anon
USING (true) WITH CHECK (true);
