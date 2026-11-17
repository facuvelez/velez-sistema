-- Crear registros históricos para múltiples deudas canceladas de Carlos Alvarado
INSERT INTO public.debt_history (
    debt_id,
    service_id,
    client_id,
    original_amount,
    debt_created_at,
    fully_paid_at,
    days_to_cancel
) VALUES 
-- Deuda 1: Servicio de Neumáticos - Cancelada en 15 días
(
    gen_random_uuid(),
    '442f6d86-d402-4d20-857f-eb9e959e3258',  -- Servicio de Neumáticos $128,000
    '4bb6a495-38bf-434e-96ae-0f10f71be5c2',
    128000.00,
    '2024-10-29 12:00:00+00',  -- Fecha del servicio
    '2024-11-13 12:00:00+00',  -- Cancelada 15 días después
    15
),
-- Deuda 2: Servicio de Alineación - Cancelada en 3 días (pago rápido)
(
    gen_random_uuid(),
    '26d3b50d-9b1b-4125-8d46-4e2cfb11a366',  -- Servicio de Alineación $29,000
    '4bb6a495-38bf-434e-96ae-0f10f71be5c2',
    29000.00,
    '2024-02-07 12:00:00+00',  -- Fecha del servicio
    '2024-02-10 12:00:00+00',  -- Cancelada 3 días después
    3
),
-- Deuda 3: Servicio de Repuestos - Cancelada en 30 días
(
    gen_random_uuid(),
    'ca2fc5bd-0a22-4182-930a-4bf7ea26add3',  -- Servicio de Repuestos $20,500
    '4bb6a495-38bf-434e-96ae-0f10f71be5c2',
    20500.00,
    '2025-07-02 09:57:46+00',  -- Fecha del servicio
    '2025-08-01 12:00:00+00',  -- Cancelada 30 días después
    30
),
-- Deuda 4: Servicio de Repuestos - Cancelada en 7 días
(
    gen_random_uuid(),
    '0cbd263f-0ccb-4fec-8e35-682c36420c6c',  -- Servicio de Repuestos $54,000
    '4bb6a495-38bf-434e-96ae-0f10f71be5c2',
    54000.00,
    '2025-07-04 00:40:23+00',  -- Fecha del servicio
    '2025-07-11 12:00:00+00',  -- Cancelada 7 días después
    7
);