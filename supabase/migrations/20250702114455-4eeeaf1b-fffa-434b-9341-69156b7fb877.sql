-- Crear función para cancelar/eliminar deudas y sincronizar servicios
CREATE OR REPLACE FUNCTION public.cancel_debt_and_sync_service()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update service status when debt is deleted
    UPDATE public.services 
    SET status = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND id != OLD.id AND remaining_amount > 0) THEN 'paid'::service_status
        ELSE 'partial'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT SUM(remaining_amount) FROM public.debts WHERE service_id = services.id AND id != OLD.id), 0),
    updated_at = now()
    WHERE id = OLD.service_id;
    
    RETURN OLD;
END;
$function$;

-- Crear trigger para cuando se elimina una deuda
DROP TRIGGER IF EXISTS cancel_debt_sync_service_trigger ON public.debts;
CREATE TRIGGER cancel_debt_sync_service_trigger
    AFTER DELETE ON public.debts
    FOR EACH ROW
    EXECUTE FUNCTION public.cancel_debt_and_sync_service();

-- Mejorar la función de actualización de deudas para manejar mejor la sincronización
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    service_record RECORD;
BEGIN
    -- Update the remaining amount on the debt
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- Get the service_id before potentially deleting the debt
    SELECT service_id INTO service_record FROM public.debts WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, remove it
    DELETE FROM public.debts 
    WHERE id = NEW.debt_id AND remaining_amount <= 0;
    
    -- Update service status based on remaining debts for this service
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT SUM(remaining_amount) FROM public.debts WHERE service_id = services.id), 0),
    updated_at = now()
    WHERE id = service_record.service_id;
    
    RETURN NEW;
END;
$function$;

-- Asegurar que los triggers estén activos
DROP TRIGGER IF EXISTS update_debt_on_payment_trigger ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment_trigger
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

DROP TRIGGER IF EXISTS update_debt_on_payment_update_trigger ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment_update_trigger
    AFTER UPDATE ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

-- Crear función para cancelar deuda completamente
CREATE OR REPLACE FUNCTION public.cancel_debt(debt_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    service_id_var UUID;
BEGIN
    -- Get service_id before deleting
    SELECT service_id INTO service_id_var FROM public.debts WHERE id = debt_id_param;
    
    -- Delete the debt
    DELETE FROM public.debts WHERE id = debt_id_param;
    
    -- Update service status
    UPDATE public.services 
    SET status = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.debts WHERE service_id = service_id_var AND remaining_amount > 0) THEN 'paid'::service_status
        ELSE 'partial'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT SUM(remaining_amount) FROM public.debts WHERE service_id = service_id_var), 0),
    updated_at = now()
    WHERE id = service_id_var;
END;
$function$;