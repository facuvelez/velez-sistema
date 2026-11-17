ALTER TABLE public.alineador_vacaciones 
ADD COLUMN IF NOT EXISTS es_enfermedad BOOLEAN NOT NULL DEFAULT false;