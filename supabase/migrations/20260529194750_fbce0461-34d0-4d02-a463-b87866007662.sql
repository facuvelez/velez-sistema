
-- ============ 1.2 Drop anon policies on data tables ============
DROP POLICY IF EXISTS "Allow anon write access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated anon access to appointments" ON public.appointments;

DROP POLICY IF EXISTS "Allow anon write access to cheques" ON public.cheques;
DROP POLICY IF EXISTS "Allow authenticated anon access to cheques" ON public.cheques;

DROP POLICY IF EXISTS "Allow anon write access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated anon access to clients" ON public.clients;

DROP POLICY IF EXISTS "Allow anon write access to debts" ON public.debts;
DROP POLICY IF EXISTS "Allow authenticated anon access to debts" ON public.debts;

DROP POLICY IF EXISTS "Allow anon write access to debt_history" ON public.debt_history;
DROP POLICY IF EXISTS "Allow authenticated anon access to debt_history" ON public.debt_history;

DROP POLICY IF EXISTS "Allow anon write access to debt_payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Allow authenticated anon access to debt_payments" ON public.debt_payments;

DROP POLICY IF EXISTS "Allow anon write access to services" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated anon access to services" ON public.services;

DROP POLICY IF EXISTS "Allow anon access to suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon access to supplier_brands" ON public.supplier_brands;
DROP POLICY IF EXISTS "Allow anon access to supplier_purchases" ON public.supplier_purchases;
DROP POLICY IF EXISTS "Allow anon access to supplier_purchase_items" ON public.supplier_purchase_items;

-- Tighten {public} role to {authenticated} for debt_history and service_prices
DROP POLICY IF EXISTS "Administrators and Secretaries can manage debt history" ON public.debt_history;
CREATE POLICY "Administrators and Secretaries can manage debt history"
  ON public.debt_history
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
  WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

DROP POLICY IF EXISTS "Administrators and Secretaries can view prices" ON public.service_prices;
CREATE POLICY "Administrators and Secretaries can view prices"
  ON public.service_prices
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

DROP POLICY IF EXISTS "Only Administrators can manage prices" ON public.service_prices;
CREATE POLICY "Only Administrators can manage prices"
  ON public.service_prices
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'Administrator'::user_role)
  WITH CHECK (get_current_user_role() = 'Administrator'::user_role);

-- Tighten appointments policies that were {public}
DROP POLICY IF EXISTS "Operators can view appointments" ON public.appointments;
CREATE POLICY "Operators can view appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'Operator'::user_role);

DROP POLICY IF EXISTS "Alineadores can manage appointments" ON public.appointments;
CREATE POLICY "Alineadores can manage appointments"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'Alineador'::user_role)
  WITH CHECK (get_current_user_role() = 'Alineador'::user_role);

-- Revoke anon grants on these tables (defense in depth)
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.cheques FROM anon;
REVOKE ALL ON public.clients FROM anon;
REVOKE ALL ON public.debts FROM anon;
REVOKE ALL ON public.debt_history FROM anon;
REVOKE ALL ON public.debt_payments FROM anon;
REVOKE ALL ON public.services FROM anon;
REVOKE ALL ON public.suppliers FROM anon;
REVOKE ALL ON public.supplier_brands FROM anon;
REVOKE ALL ON public.supplier_purchases FROM anon;
REVOKE ALL ON public.supplier_purchase_items FROM anon;
REVOKE ALL ON public.service_prices FROM anon;

-- ============ 1.3 BEFORE DELETE protection triggers ============
CREATE OR REPLACE FUNCTION public.prevent_client_delete_with_refs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  svc_count int;
  debt_count int;
BEGIN
  SELECT count(*) INTO svc_count FROM public.services WHERE client_id = OLD.id;
  SELECT count(*) INTO debt_count FROM public.debts WHERE client_id = OLD.id;
  IF svc_count > 0 OR debt_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el cliente: tiene % servicio(s) y % deuda(s) asociados', svc_count, debt_count
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_client_delete_with_refs ON public.clients;
CREATE TRIGGER trg_prevent_client_delete_with_refs
  BEFORE DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_delete_with_refs();

CREATE OR REPLACE FUNCTION public.prevent_service_delete_with_refs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_debts int;
  payments_count int;
BEGIN
  SELECT count(*) INTO active_debts FROM public.debts WHERE service_id = OLD.id AND remaining_amount > 0;
  SELECT count(*) INTO payments_count
    FROM public.debt_payments dp
    JOIN public.debt_history dh ON dh.debt_id = dp.debt_id
    WHERE dh.service_id = OLD.id;
  IF active_debts > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el servicio: tiene deudas activas. Cancelá la deuda primero.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF payments_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el servicio: tiene pagos registrados en el historial.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_service_delete_with_refs ON public.services;
CREATE TRIGGER trg_prevent_service_delete_with_refs
  BEFORE DELETE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_service_delete_with_refs();

-- ============ 1.4 Drop legacy auth RPCs ============
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);
DROP FUNCTION IF EXISTS public.update_user_password(text, text);
DROP FUNCTION IF EXISTS public.create_user_simple(text, text, user_role);
DROP FUNCTION IF EXISTS public.get_user_email_by_username(text);
