-- Corregir manualmente la deuda específica con ID f93992a0-eba7-4797-9832-e4ed58125b34
UPDATE public.debts 
SET remaining_amount = remaining_amount - 160000,
    updated_at = now()
WHERE id = 'f93992a0-eba7-4797-9832-e4ed58125b34';

-- Actualizar el estado del servicio correspondiente
UPDATE public.services 
SET status = CASE 
    WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = '164d8ad4-8d82-44bb-a8bf-62c791d1b8db' AND remaining_amount > 0) THEN 
        CASE 
            WHEN amount_delivered > 0 THEN 'partial'::service_status
            ELSE 'pending'::service_status
        END
    ELSE 'paid'::service_status
END,
updated_at = now()
WHERE id = '164d8ad4-8d82-44bb-a8bf-62c791d1b8db';