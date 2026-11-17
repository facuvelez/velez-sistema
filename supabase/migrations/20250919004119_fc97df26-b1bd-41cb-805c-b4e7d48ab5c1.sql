-- Crear registros históricos para servicios pagados que tuvieron deudas
DO $$
DECLARE
    service_record RECORD;
    days_difference INTEGER;
BEGIN
    -- Buscar servicios que están pagados pero que tuvieron deudas (total_amount > amount_delivered inicialmente)
    FOR service_record IN 
        SELECT s.id as service_id, 
               s.client_id, 
               s.service_date,
               s.total_amount,
               s.amount_delivered,
               s.created_at,
               s.updated_at
        FROM services s
        WHERE s.client_id = '4bb6a495-38bf-434e-96ae-0f10f71be5c2'
        AND s.status = 'paid'  -- Servicios completamente pagados
        AND s.total_amount > 0  -- Que tuvieron un monto
        AND NOT EXISTS (SELECT 1 FROM debt_history dh WHERE dh.service_id = s.id)  -- Sin historial
    LOOP
        -- Calcular días entre creación del servicio y su actualización final
        days_difference := EXTRACT(DAYS FROM (service_record.updated_at - service_record.created_at))::integer;
        
        -- Si los días son 0, usar 1 día como mínimo para el cálculo
        IF days_difference = 0 THEN
            days_difference := 1;
        END IF;
        
        -- Crear registro histórico para este servicio que se pagó completamente
        INSERT INTO public.debt_history (
            debt_id,
            service_id,
            client_id,
            original_amount,
            debt_created_at,
            fully_paid_at,
            days_to_cancel
        ) VALUES (
            gen_random_uuid(), -- Generar un UUID para debt_id ya que no existe la deuda original
            service_record.service_id,
            service_record.client_id,
            (service_record.total_amount - service_record.amount_delivered), -- Monto que se debía
            service_record.created_at,
            service_record.updated_at,
            days_difference
        );
        
        RAISE NOTICE 'Creado registro histórico para servicio % con % días', service_record.service_id, days_difference;
    END LOOP;
END $$;