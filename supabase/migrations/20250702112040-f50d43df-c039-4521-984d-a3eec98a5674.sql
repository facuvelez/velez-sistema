-- Verificar y mejorar la función de actualización de deudas al hacer pagos
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the remaining amount on the debt
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, remove it
    DELETE FROM public.debts 
    WHERE id = NEW.debt_id AND remaining_amount <= 0;
    
    -- Update service status based on remaining debt
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 'partial'::service_status
        ELSE 'paid'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT remaining_amount FROM public.debts WHERE service_id = services.id), 0),
    updated_at = now()
    WHERE id = (SELECT service_id FROM public.debts WHERE id = NEW.debt_id);
    
    RETURN NEW;
END;
$function$;

-- Asegurar que el trigger esté activo
DROP TRIGGER IF EXISTS update_debt_on_payment_trigger ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment_trigger
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

-- También crear un trigger para actualizaciones de pagos
DROP TRIGGER IF EXISTS update_debt_on_payment_update_trigger ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment_update_trigger
    AFTER UPDATE ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

-- Función para sincronizar todos los servicios existentes (ejecutar una vez para arreglar inconsistencias)
CREATE OR REPLACE FUNCTION public.sync_all_services_with_debts()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Actualizar todos los servicios basándose en sus deudas actuales
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT remaining_amount FROM public.debts WHERE service_id = services.id), 0),
    updated_at = now();
    
    RAISE NOTICE 'Sincronización completada para todos los servicios';
END;
$function$;

-- Ejecutar la sincronización para arreglar cualquier inconsistencia existente
SELECT public.sync_all_services_with_debts();