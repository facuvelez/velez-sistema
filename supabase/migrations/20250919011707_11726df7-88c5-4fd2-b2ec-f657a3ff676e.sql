-- Crear registros históricos de deudas canceladas para todos los clientes

-- Germán Frias - Patrón de pago rápido (2-8 días)
INSERT INTO public.debt_history (
    debt_id,
    service_id,
    client_id,
    original_amount,
    debt_created_at,
    fully_paid_at,
    days_to_cancel
) VALUES 
-- Servicio de Neumáticos $385,000 - Cancelada en 5 días
(
    gen_random_uuid(),
    '604a92b2-49af-470d-8cb5-c465b49ad4de',
    '63212fcc-6586-42fa-8433-0d991b47f255',
    385000.00,
    '2025-03-01 12:00:00+00',
    '2025-03-06 12:00:00+00',
    5
),
-- Servicio de Neumáticos $2,000,000 - Cancelada en 8 días
(
    gen_random_uuid(),
    'de9fbcfb-9b4e-43b4-9302-cf7168f6ae4c',
    '63212fcc-6586-42fa-8433-0d991b47f255',
    2000000.00,
    '2025-07-01 12:00:00+00',
    '2025-07-09 12:00:00+00',
    8
),
-- Servicio de Llantas $460,000 - Cancelada en 3 días
(
    gen_random_uuid(),
    '8a869316-b2e9-420a-977a-4c2ec7b2a21c',
    '63212fcc-6586-42fa-8433-0d991b47f255',
    460000.00,
    '2025-07-21 12:00:00+00',
    '2025-07-24 12:00:00+00',
    3
),

-- Ignacio Sinfreu - Patrón de pago normal (7-25 días)
-- Servicio de Repuestos $58,100 - Cancelada en 12 días
(
    gen_random_uuid(),
    '1a0e85bd-ada3-4b3c-9fbc-c48a7ecd825d',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69',
    58100.00,
    '2025-07-03 12:00:00+00',
    '2025-07-15 12:00:00+00',
    12
),
-- Servicio de Neumáticos y Llantas $2,780,000 - Cancelada en 20 días
(
    gen_random_uuid(),
    'efbcf691-4749-40c3-b432-c3123c3fcf80',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69',
    2780000.00,
    '2025-07-04 12:00:00+00',
    '2025-07-24 12:00:00+00',
    20
),
-- Servicio de Arme $25,000 - Cancelada en 7 días
(
    gen_random_uuid(),
    'e0d01f10-aacb-4509-8d7a-b00b7f473af4',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69',
    25000.00,
    '2025-07-04 12:00:00+00',
    '2025-07-11 12:00:00+00',
    7
),
-- Servicio de Balanceo $60,240 - Cancelada en 25 días
(
    gen_random_uuid(),
    '55d054cd-ef26-4516-bc92-241f31c37868',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69',
    60240.00,
    '2025-07-04 12:00:00+00',
    '2025-07-29 12:00:00+00',
    25
),

-- Laura Cabral - Patrón de pago lento (35-60 días)
-- Servicio de Alineación $25,900 - Cancelada en 45 días
(
    gen_random_uuid(),
    '8c35b3ba-dab2-4e10-a80c-131d004a7165',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    25900.00,
    '2024-07-04 12:00:00+00',
    '2024-08-18 12:00:00+00',
    45
),
-- Servicio de Llantas $128,000 - Cancelada en 35 días
(
    gen_random_uuid(),
    '1ff68022-b8a3-44dc-aeb5-9ba8c8d6c2b9',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    128000.00,
    '2024-08-02 12:00:00+00',
    '2024-09-06 12:00:00+00',
    35
),
-- Servicio de Alineado $25,000 - Cancelada en 60 días
(
    gen_random_uuid(),
    '4095fdd8-c920-4a91-84c9-06ff2a5efc5d',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    25000.00,
    '2024-11-07 12:00:00+00',
    '2025-01-06 12:00:00+00',
    60
),

-- Municipalidad Berrotarán - Patrón de pago normal (15-30 días, típico de entidades gubernamentales)
-- Servicio de Balanceo $25,000 - Cancelada en 30 días
(
    gen_random_uuid(),
    'a71510b1-a16c-4577-81a7-15119fddb827',
    'c8310912-c1ad-420b-8cfc-bbbe1e64bdc2',
    25000.00,
    '2025-07-04 12:00:00+00',
    '2025-08-03 12:00:00+00',
    30
),
-- Servicio de Reparación $27,500 - Cancelada en 15 días
(
    gen_random_uuid(),
    'b360f504-9c87-4008-9263-ffaedb82d4cc',
    'c8310912-c1ad-420b-8cfc-bbbe1e64bdc2',
    27500.00,
    '2025-07-04 12:00:00+00',
    '2025-07-19 12:00:00+00',
    15
),

-- Velez Neumaticos - Patrón de pago rápido (2-10 días, empresa especializada)
-- Servicio de Cambio de Aceite $150,500 - Cancelada en 2 días
(
    gen_random_uuid(),
    '501edc36-0336-4297-8b3f-cb424405a8bc',
    'e1b50679-e666-47dc-bf1e-e535accd8bff',
    150500.00,
    '2025-02-13 12:00:00+00',
    '2025-02-15 12:00:00+00',
    2
),
-- Servicio de Reparación de Llantas $500,000 - Cancelada en 6 días
(
    gen_random_uuid(),
    'e7895411-8a49-43b1-acfe-0b9b4b83b43f',
    'e1b50679-e666-47dc-bf1e-e535accd8bff',
    500000.00,
    '2025-07-02 12:00:00+00',
    '2025-07-08 12:00:00+00',
    6
),
-- Servicio de Neumáticos $5,000,000 - Cancelada en 10 días
(
    gen_random_uuid(),
    'f4a6f420-1bc0-43d8-9c73-5980a5818b8c',
    'e1b50679-e666-47dc-bf1e-e535accd8bff',
    5000000.00,
    '2025-07-04 12:00:00+00',
    '2025-07-14 12:00:00+00',
    10
);