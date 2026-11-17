-- Función para corregir manualmente los cálculos de deudas pendientes
CREATE OR REPLACE FUNCTION public.fix_debt_calculations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    debt_record RECORD;
    total_payments DECIMAL(10,2);
BEGIN
    -- Iterar sobre todas las deudas que tienen pagos
    FOR debt_record IN 
        SELECT DISTINCT d.id, d.original_amount
        FROM public.debts d
        INNER JOIN public.debt_payments dp ON d.id = dp.debt_id
    LOOP
        -- Calcular el total de pagos para esta deuda
        SELECT COALESCE(SUM(amount), 0) INTO total_payments
        FROM public.debt_payments
        WHERE debt_id = debt_record.id;
        
        -- Actualizar el remaining_amount
        UPDATE public.debts 
        SET remaining_amount = debt_record.original_amount - total_payments,
            updated_at = now()
        WHERE id = debt_record.id;
        
        -- Si la deuda está completamente pagada, eliminarla
        IF (debt_record.original_amount - total_payments) <= 0 THEN
            DELETE FROM public.debts WHERE id = debt_record.id;
        END IF;
        
        RAISE NOTICE 'Corregida deuda %: original=%, pagos=%, restante=%', 
                     debt_record.id, 
                     debt_record.original_amount, 
                     total_payments, 
                     (debt_record.original_amount - total_payments);
    END LOOP;
    
    RAISE NOTICE 'Corrección de cálculos completada';
END;
$function$