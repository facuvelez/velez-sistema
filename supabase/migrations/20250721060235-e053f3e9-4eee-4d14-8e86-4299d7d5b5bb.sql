-- Eliminar la función anterior y crear una nueva con SECURITY DEFINER
DROP FUNCTION IF EXISTS fix_existing_debt_payment();

-- Crear función con privilegios elevados para corregir pagos existentes
CREATE OR REPLACE FUNCTION fix_existing_debt_payment()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_record RECORD;
    service_record RECORD;
BEGIN
    -- Buscar todos los pagos que no han actualizado las deudas correctamente
    FOR payment_record IN 
        SELECT dp.*, d.remaining_amount, d.original_amount, d.service_id
        FROM debt_payments dp
        JOIN debts d ON dp.debt_id = d.id
        WHERE d.remaining_amount = d.original_amount -- Deudas que no se han actualizado
    LOOP
        RAISE NOTICE 'Procesando pago de % para deuda %', payment_record.amount, payment_record.debt_id;
        
        -- Actualizar el remaining_amount de la deuda
        UPDATE public.debts 
        SET remaining_amount = remaining_amount - payment_record.amount,
            updated_at = now()
        WHERE id = payment_record.debt_id;
        
        -- Si la deuda está completamente pagada, eliminarla
        DELETE FROM public.debts 
        WHERE id = payment_record.debt_id AND remaining_amount <= 0;
        
        -- Actualizar el estado del servicio
        UPDATE public.services 
        SET status = CASE 
            WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = payment_record.service_id AND remaining_amount > 0) THEN 
                CASE 
                    WHEN amount_delivered > 0 THEN 'partial'::service_status
                    ELSE 'pending'::service_status
                END
            ELSE 'paid'::service_status
        END,
        updated_at = now()
        WHERE id = payment_record.service_id;
        
        RAISE NOTICE 'Deuda % actualizada correctamente', payment_record.debt_id;
    END LOOP;
    
    RAISE NOTICE 'Corrección completada para todas las deudas con pagos pendientes';
END;
$$;