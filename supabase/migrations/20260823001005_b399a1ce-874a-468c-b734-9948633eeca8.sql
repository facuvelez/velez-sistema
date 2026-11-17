ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS delivery_time_estimate TEXT;

CREATE TABLE public.whatsapp_authorized_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_authorized_numbers TO authenticated;
GRANT ALL ON public.whatsapp_authorized_numbers TO service_role;
ALTER TABLE public.whatsapp_authorized_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Administracion can manage whatsapp numbers"
ON public.whatsapp_authorized_numbers
FOR ALL TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]))
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]));

CREATE TRIGGER update_whatsapp_authorized_numbers_updated_at
BEFORE UPDATE ON public.whatsapp_authorized_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Administracion can view whatsapp messages"
ON public.whatsapp_messages
FOR SELECT TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Administracion'::user_role]));

CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone_number, created_at);