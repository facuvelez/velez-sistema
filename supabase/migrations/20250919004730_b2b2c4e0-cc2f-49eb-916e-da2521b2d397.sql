-- Limpiar registros históricos incorrectos y recrear con fechas reales de pagos
DELETE FROM public.debt_history 
WHERE client_id = '4bb6a495-38bf-434e-96ae-0f10f71be5c2';

-- Recrear registros históricos usando fechas reales de pagos de deudas
DO $$
DECLARE
    service_record RECORD;
    payment_record RECORD;
    debt_created_date TIMESTAMP WITH TIME ZONE;
    last_payment_date DATE;
    days_difference INTEGER;
BEGIN
    -- Buscar servicios pagados que tuvieron pagos de deuda registrados
    FOR service_record IN 
        SELECT DISTINCT s.id as service_id, 
               s.client_id, 
               s.service_date,
               s.total_amount,
               s.amount_delivered,
               s.created_at
        FROM services s
        WHERE s.client_id = '4bb6a495-38bf-434e-96ae-0f10f71be5c2'
        AND s.status = 'paid'
        AND EXISTS (
            SELECT 1 FROM debt_payments dp 
            JOIN debts d ON dp.debt_id = d.id 
            WHERE d.service_id = s.id
        )
    LOOP
        -- Encontrar la fecha del último pago para este servicio
        SELECT MAX(dp.payment_date) INTO last_payment_date
        FROM debt_payments dp 
        JOIN debts d ON dp.debt_id = d.id 
        WHERE d.service_id = service_record.service_id;
        
        -- Si encontramos pagos, usar la fecha del servicio como inicio de la deuda
        IF last_payment_date IS NOT NULL THEN
            debt_created_date := service_record.created_at;
            
            -- Calcular días entre creación de la deuda y último pago
            days_difference := EXTRACT(DAYS FROM (last_payment_date::timestamp with time zone - debt_created_date))::integer;
            
            -- Asegurar que sea al menos 1 día
            IF days_difference <= 0 THEN
                days_difference := 1;
            END IF;
            
            -- Crear registro histórico con fechas reales
            INSERT INTO public.debt_history (
                debt_id,
                service_id,
                client_id,
                original_amount,
                debt_created_at,
                fully_paid_at,
                days_to_cancel
            ) VALUES (
                gen_random_uuid(),
                service_record.service_id,
                service_record.client_id,
                (service_record.total_amount - service_record.amount_delivered),
                debt_created_date,
                last_payment_date::timestamp with time zone,
                days_difference
            );
            
            RAISE NOTICE 'Creado registro histórico para servicio % con % días (deuda: %, pago: %)', 
                service_record.service_id, days_difference, debt_created_date::date, last_payment_date;
        END IF;
    END LOOP;
END $$;