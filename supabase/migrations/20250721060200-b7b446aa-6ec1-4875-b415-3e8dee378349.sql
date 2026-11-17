-- Crear función temporal para corregir pagos existentes
CREATE OR REPLACE FUNCTION fix_existing_debt_payment()
RETURNS void AS $$
DECLARE
    payment_record RECORD;
BEGIN
    -- Buscar todos los pagos que no han actualizado las deudas correctamente
    FOR payment_record IN 
        SELECT dp.*, d.remaining_amount, d.original_amount
        FROM debt_payments dp
        JOIN debts d ON dp.debt_id = d.id
        WHERE d.remaining_amount = d.original_amount -- Deudas que no se han actualizado
    LOOP
        -- Actualizar el remaining_amount de la deuda
        UPDATE public.debts 
        SET remaining_amount = remaining_amount - payment_record.amount,
            updated_at = now()
        WHERE id = payment_record.debt_id;
        
        -- Obtener el service_id para actualizar el servicio
        DECLARE
            service_record RECORD;
        BEGIN
            SELECT service_id INTO service_record FROM public.debts WHERE id = payment_record.debt_id;
            
            -- Si la deuda está completamente pagada, eliminarla
            DELETE FROM public.debts 
            WHERE id = payment_record.debt_id AND remaining_amount <= 0;
            
            -- Actualizar el estado del servicio
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
        END;
    END LOOP;
    
    RAISE NOTICE 'Corrección aplicada a todas las deudas con pagos pendientes';
END;
$$ LANGUAGE plpgsql;