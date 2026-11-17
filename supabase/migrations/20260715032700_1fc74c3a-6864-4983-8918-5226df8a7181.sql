
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medida TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  precio_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "productos admin manage" ON public.productos FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator','Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator','Administracion'));
CREATE INDEX idx_productos_marca ON public.productos(marca);
CREATE INDEX idx_productos_medida ON public.productos(medida);

CREATE TABLE public.competidores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  seller_id_mercadolibre TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competidores TO authenticated;
GRANT ALL ON public.competidores TO service_role;
ALTER TABLE public.competidores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competidores admin manage" ON public.competidores FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator','Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator','Administracion'));

CREATE TABLE public.matches_producto_competidor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  competidor_id UUID NOT NULL REFERENCES public.competidores(id) ON DELETE CASCADE,
  publication_id TEXT NOT NULL,
  titulo_publicacion TEXT,
  confirmado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(producto_id, competidor_id, publication_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches_producto_competidor TO authenticated;
GRANT ALL ON public.matches_producto_competidor TO service_role;
ALTER TABLE public.matches_producto_competidor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches admin manage" ON public.matches_producto_competidor FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator','Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator','Administracion'));
CREATE INDEX idx_matches_producto ON public.matches_producto_competidor(producto_id);
CREATE INDEX idx_matches_competidor ON public.matches_producto_competidor(competidor_id);

CREATE TABLE public.precios_competencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  competidor_id UUID NOT NULL REFERENCES public.competidores(id) ON DELETE CASCADE,
  publication_id TEXT NOT NULL,
  titulo_publicacion TEXT,
  precio NUMERIC(12,2) NOT NULL,
  stock_disponible INTEGER,
  fecha_relevamiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.precios_competencia TO authenticated;
GRANT ALL ON public.precios_competencia TO service_role;
ALTER TABLE public.precios_competencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precios_competencia admin manage" ON public.precios_competencia FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator','Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator','Administracion'));
CREATE INDEX idx_precios_producto_fecha ON public.precios_competencia(producto_id, fecha_relevamiento DESC);
CREATE INDEX idx_precios_publication ON public.precios_competencia(publication_id);

CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_competidores_updated_at BEFORE UPDATE ON public.competidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches_producto_competidor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_producto_min_competencia(p_producto_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_min NUMERIC;
BEGIN
  v_role := public.get_current_user_role();
  IF v_role IS NULL OR v_role NOT IN ('Administrator','Administracion') THEN
    RETURN NULL;
  END IF;

  WITH latest AS (
    SELECT DISTINCT ON (pc.publication_id, pc.competidor_id)
      pc.precio
    FROM public.precios_competencia pc
    INNER JOIN public.matches_producto_competidor m
      ON m.producto_id = pc.producto_id
     AND m.competidor_id = pc.competidor_id
     AND m.publication_id = pc.publication_id
    WHERE pc.producto_id = p_producto_id
      AND m.confirmado = true
    ORDER BY pc.publication_id, pc.competidor_id, pc.fecha_relevamiento DESC
  )
  SELECT MIN(precio) INTO v_min FROM latest;

  RETURN v_min;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_producto_min_competencia(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_producto_min_competencia(UUID) TO authenticated;
