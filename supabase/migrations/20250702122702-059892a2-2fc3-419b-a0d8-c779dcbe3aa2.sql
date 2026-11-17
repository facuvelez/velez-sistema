-- Corregir la categoría de Laura Cabral que compró Llantas (debería ser 'venta', no 'servicio')
UPDATE public.services 
SET category = 'venta' 
WHERE client_id = (SELECT id FROM public.clients WHERE first_name = 'Laura' AND last_name = 'Cabral') 
  AND service_type = 'Llantas';