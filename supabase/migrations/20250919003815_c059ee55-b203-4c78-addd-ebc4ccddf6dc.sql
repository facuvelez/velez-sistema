-- Crear el trigger para registrar historial de deudas pagadas
CREATE TRIGGER debt_payment_history_trigger
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment_with_history();

-- Poblar manualmente el historial para pagos existentes que cancelaron deudas completamente
DO $$
DECLARE
    payment_record RECORD;
    debt_record RECORD;
    service_record RECORD;
BEGIN
    -- Buscar pagos que posiblemente cancelaron deudas completamente
    FOR payment_record IN 
        SELECT dp.*, 
               s.client_id,
               s.created_at as service_created_at
        FROM debt_payments dp
        JOIN services s ON EXISTS (
            SELECT 1 FROM debts d 
            WHERE d.id = dp.debt_id 
            AND d.service_id = s.id
        )
        WHERE NOT EXISTS (
            SELECT 1 FROM debt_history dh 
            WHERE dh.debt_id = dp.debt_id
        )
    LOOP
        -- Verificar si esta deuda ya no existe (fue pagada completamente)
        SELECT * INTO debt_record FROM debts WHERE id = payment_record.debt_id;
        
        IF NOT FOUND THEN
            -- La deuda no existe, significa que fue pagada completamente
            -- Crear registro en debt_history
            INSERT INTO public.debt_history (
                debt_id,
                service_id,
                client_id,
                original_amount,
                debt_created_at,
                fully_paid_at,
                days_to_cancel
            ) VALUES (
                payment_record.debt_id,
                (SELECT service_id FROM services WHERE client_id = payment_record.client_id AND created_at = payment_record.service_created_at LIMIT 1),
                payment_record.client_id,
                payment_record.amount, -- Asumimos que este pago canceló la deuda
                payment_record.service_created_at,
                payment_record.payment_date::timestamp with time zone,
                EXTRACT(DAYS FROM (payment_record.payment_date::timestamp with time zone - payment_record.service_created_at))::integer
            );
            
            RAISE NOTICE 'Creado registro histórico para deuda %', payment_record.debt_id;
        END IF;
    END LOOP;
END $$;