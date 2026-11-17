-- Modificar la función manage_service_debt para que no cree deudas cuando el servicio está en estado 'pending' sin amount_delivered
-- Esto permitirá que los servicios creados por operarios se mantengan como pendientes hasta que la secretaria los complete

CREATE OR REPLACE FUNCTION public.manage_service_debt()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate pending amount
    DECLARE
        pending_amount DECIMAL(10,2);
    BEGIN
        pending_amount := NEW.total_amount - NEW.amount_delivered;
        
        -- Solo crear deudas si:
        -- 1. El servicio NO está en estado 'pending' con amount_delivered = 0 (servicios de operarios)
        -- 2. Hay un monto pendiente
        IF pending_amount > 0 AND NOT (NEW.status = 'pending' AND NEW.amount_delivered = 0) THEN
            INSERT INTO public.debts (client_id, service_id, original_amount, remaining_amount)
            VALUES (NEW.client_id, NEW.id, pending_amount, pending_amount)
            ON CONFLICT (service_id) 
            DO UPDATE SET 
                remaining_amount = pending_amount,
                updated_at = now();
        ELSE
            -- Si no hay monto pendiente o es un servicio pendiente de operario, eliminar cualquier deuda existente
            DELETE FROM public.debts WHERE service_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;