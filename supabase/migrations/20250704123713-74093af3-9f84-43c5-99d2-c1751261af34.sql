-- Modificar la función manage_service_debt para que NO altere el amount_delivered original
CREATE OR REPLACE FUNCTION public.manage_service_debt()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Calculate pending amount
    DECLARE
        pending_amount DECIMAL(10,2);
    BEGIN
        pending_amount := NEW.total_amount - NEW.amount_delivered;
        
        -- If there's a pending amount, create or update debt
        IF pending_amount > 0 THEN
            INSERT INTO public.debts (client_id, service_id, original_amount, remaining_amount)
            VALUES (NEW.client_id, NEW.id, pending_amount, pending_amount)
            ON CONFLICT (service_id) 
            DO UPDATE SET 
                remaining_amount = pending_amount,
                updated_at = now();
        ELSE
            -- If no pending amount, remove any existing debt
            DELETE FROM public.debts WHERE service_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END;
END;
$function$;

-- Modificar sync_all_services_with_debts para NO alterar amount_delivered
CREATE OR REPLACE FUNCTION public.sync_all_services_with_debts()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Actualizar solo el status basándose en las deudas actuales, SIN tocar amount_delivered
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    updated_at = now();
    
    RAISE NOTICE 'Sincronización completada para todos los servicios - amount_delivered preservado';
END;
$function$;

-- Modificar update_debt_on_payment para NO alterar amount_delivered
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
    
    -- Update service status ONLY, sin tocar amount_delivered
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