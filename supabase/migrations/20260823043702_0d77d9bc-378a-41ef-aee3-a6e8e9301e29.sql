UPDATE public.whatsapp_authorized_numbers
SET phone_number = regexp_replace(
  regexp_replace(regexp_replace(phone_number, '\D', '', 'g'), '^(549|54)', ''),
  '^9', ''
);

INSERT INTO public.whatsapp_authorized_numbers (phone_number, display_name, is_active) VALUES
  ('3584908590', 'Facundo', true),
  ('3585181710', NULL, true),
  ('3584192695', 'Gustavo', true),
  ('3584398116', 'Yanina', true),
  ('3584249007', 'Germán', true)
ON CONFLICT (phone_number) DO UPDATE
  SET display_name = EXCLUDED.display_name, is_active = true;