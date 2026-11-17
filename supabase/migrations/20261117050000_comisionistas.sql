-- Módulo Comisionistas: comisionistas y sus recorridos (todos pasan por Berrotarán)

CREATE TABLE public.comisionistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  localidad_base TEXT,
  color TEXT NOT NULL DEFAULT '#2563eb',
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comisionista_recorridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comisionista_id UUID NOT NULL REFERENCES public.comisionistas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  -- días de la semana en que sale: 0=domingo ... 6=sábado
  dias SMALLINT[] NOT NULL DEFAULT '{}',
  horario TEXT,
  costo_aprox NUMERIC,
  costo_nota TEXT,
  -- 'ambos' | 'envio' (llevar desde Berrotarán) | 'retiro' (traer a Berrotarán)
  sentido TEXT NOT NULL DEFAULT 'ambos' CHECK (sentido IN ('ambos', 'envio', 'retiro')),
  -- paradas en orden: [{ "nombre": "...", "lat": -32.4, "lng": -64.3 }]
  paradas JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- trazado por ruta: [[lat, lng], ...]
  geometria JSONB NOT NULL DEFAULT '[]'::jsonb,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comisionista_recorridos_comisionista_idx ON public.comisionista_recorridos (comisionista_id);

CREATE OR REPLACE FUNCTION public.comisionistas_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER comisionistas_updated_at BEFORE UPDATE ON public.comisionistas
  FOR EACH ROW EXECUTE FUNCTION public.comisionistas_set_updated_at();
CREATE TRIGGER comisionista_recorridos_updated_at BEFORE UPDATE ON public.comisionista_recorridos
  FOR EACH ROW EXECUTE FUNCTION public.comisionistas_set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comisionistas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comisionista_recorridos TO authenticated;
GRANT ALL ON public.comisionistas TO service_role;
GRANT ALL ON public.comisionista_recorridos TO service_role;

ALTER TABLE public.comisionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comisionista_recorridos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin y Administracion gestionan comisionistas"
  ON public.comisionistas FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator', 'Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Administracion'));

CREATE POLICY "Admin y Administracion gestionan recorridos"
  ON public.comisionista_recorridos FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('Administrator', 'Administracion'))
  WITH CHECK (public.get_current_user_role() IN ('Administrator', 'Administracion'));
