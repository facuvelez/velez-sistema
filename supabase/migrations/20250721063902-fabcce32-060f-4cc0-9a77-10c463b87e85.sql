-- Recrear la función del trigger con la lógica correcta
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    service_record RECORD;
BEGIN
    -- Update the remaining amount on the debt by subtracting the payment
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- Get the service_id before potentially deleting the debt
    SELECT service_id INTO service_record FROM public.debts WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, remove it
    DELETE FROM public.debts 
    WHERE id = NEW.debt_id AND remaining_amount <= 0;
    
    -- Update service status 
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    updated_at = now()
    WHERE id = service_record.service_id;
    
    RETURN NEW;
END;
$function$;

-- Corregir manualmente la deuda nuevamente después de arreglar la función
UPDATE public.debts 
SET remaining_amount = 1000000,
    updated_at = now()
WHERE id = 'f93992a0-eba7-4797-9832-e4ed58125b34';

-- Verificar que todo esté correcto
SELECT 
  d.id,
  d.original_amount,
  d.remaining_amount,
  d.updated_at,
  (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id) as total_payments
FROM debts d 
WHERE d.id = 'f93992a0-eba7-4797-9832-e4ed58125b34';