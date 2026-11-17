
-- ============ Price Flows ============
CREATE TABLE public.price_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  freight_threshold numeric NOT NULL DEFAULT 0,
  freight_fixed numeric NOT NULL DEFAULT 0,
  freight_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_flows TO authenticated;
GRANT ALL ON public.price_flows TO service_role;

ALTER TABLE public.price_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Secretary can view price flows"
  ON public.price_flows FOR SELECT TO authenticated
  USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE POLICY "Only Administrators can manage price flows"
  ON public.price_flows FOR ALL TO authenticated
  USING (get_current_user_role() = 'Administrator'::user_role)
  WITH CHECK (get_current_user_role() = 'Administrator'::user_role);

CREATE TRIGGER trg_price_flows_updated_at
  BEFORE UPDATE ON public.price_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Price Flow Tiers ============
CREATE TABLE public.price_flow_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.price_flows(id) ON DELETE CASCADE,
  cost_from numeric NOT NULL,
  cost_to numeric,
  wholesale_mode text NOT NULL CHECK (wholesale_mode IN ('fixed', 'percent')),
  wholesale_value numeric NOT NULL DEFAULT 0,
  public_mode text NOT NULL CHECK (public_mode IN ('fixed', 'percent')),
  public_value numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_flow_tiers_flow ON public.price_flow_tiers(flow_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_flow_tiers TO authenticated;
GRANT ALL ON public.price_flow_tiers TO service_role;

ALTER TABLE public.price_flow_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Secretary can view price flow tiers"
  ON public.price_flow_tiers FOR SELECT TO authenticated
  USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE POLICY "Only Administrators can manage price flow tiers"
  ON public.price_flow_tiers FOR ALL TO authenticated
  USING (get_current_user_role() = 'Administrator'::user_role)
  WITH CHECK (get_current_user_role() = 'Administrator'::user_role);

CREATE TRIGGER trg_price_flow_tiers_updated_at
  BEFORE UPDATE ON public.price_flow_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Seed: flujo "General" + 6 tramos ============
DO $$
DECLARE
  v_flow_id uuid;
BEGIN
  INSERT INTO public.price_flows (name, is_default, freight_threshold, freight_fixed, freight_percent)
  VALUES ('General', true, 100000, 3000, 3)
  RETURNING id INTO v_flow_id;

  INSERT INTO public.price_flow_tiers (flow_id, cost_from, cost_to, wholesale_mode, wholesale_value, public_mode, public_value, sort_order) VALUES
    (v_flow_id,      0,  50000, 'fixed', 12500, 'fixed', 20000, 1),
    (v_flow_id,  50000, 100000, 'fixed', 25000, 'fixed', 35000, 2),
    (v_flow_id, 100000, 200000, 'fixed', 40000, 'fixed', 60000, 3),
    (v_flow_id, 200000, 300000, 'fixed', 60000, 'fixed', 75000, 4),
    (v_flow_id, 300000, 500000, 'fixed', 65000, 'fixed', 80000, 5),
    (v_flow_id, 500000,   NULL, 'percent', 10, 'percent', 15, 6);
END $$;
