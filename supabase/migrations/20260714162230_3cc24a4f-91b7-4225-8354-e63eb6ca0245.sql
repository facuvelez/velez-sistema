
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  vehicle_info TEXT NOT NULL,
  tasks TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'ready_align', 'completed')),
  requires_alignment BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_by_username TEXT,
  completed_by_operator UUID REFERENCES auth.users(id),
  completed_by_operator_username TEXT,
  completed_operator_at TIMESTAMPTZ,
  completed_by_aligner UUID REFERENCES auth.users(id),
  completed_by_aligner_username TEXT,
  completed_aligner_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT false
);

GRANT SELECT, INSERT, UPDATE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read work_orders"
  ON public.work_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert work_orders"
  ON public.work_orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update work_orders"
  ON public.work_orders FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.work_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
