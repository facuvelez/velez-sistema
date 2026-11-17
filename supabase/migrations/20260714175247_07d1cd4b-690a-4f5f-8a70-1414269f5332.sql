
CREATE OR REPLACE FUNCTION public.get_operators_public()
RETURNS TABLE(username text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.profiles
  WHERE role = 'Operator'
  ORDER BY username;
$$;

GRANT EXECUTE ON FUNCTION public.get_operators_public() TO anon, authenticated;

-- Guest access for /taller (internal shop screen)
GRANT SELECT, UPDATE ON public.work_orders TO anon;

CREATE POLICY "Anon can read work_orders (guest operator)"
  ON public.work_orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update work_orders (guest operator)"
  ON public.work_orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
