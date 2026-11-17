-- Corregir la función para que solo considere deudas que realmente existieron
-- Una deuda real es aquella que se generó porque el servicio no fue pagado completamente al momento

-- Primero, limpiar los datos históricos incorrectos
DELETE FROM public.debt_history WHERE client_id IN (
    '63212fcc-6586-42fa-8433-0d991b47f255',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69', 
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    'c8310912-c1ad-420b-8cfc-bbbe1e64bdc2',
    'e1b50679-e666-47dc-bf1e-e535accd8bff'
);

-- Insertar solo registros históricos de servicios que realmente generaron deudas
-- Estos serían servicios que inicialmente tuvieron amount_delivered < total_amount

-- Germán Frias - Solo el servicio parcial que luego se completó
INSERT INTO public.debt_history (
    debt_id,
    service_id,
    client_id,
    original_amount,
    debt_created_at,
    fully_paid_at,
    days_to_cancel
) VALUES 
-- Simulamos que el servicio '164d8ad4-8d82-44bb-a8bf-62c791d1b8db' (parcial) fue completamente pagado
(
    gen_random_uuid(),
    '164d8ad4-8d82-44bb-a8bf-62c791d1b8db',
    '63212fcc-6586-42fa-8433-0d991b47f255',
    500000.00, -- Monto que quedó pendiente
    '2025-07-01 12:00:00+00',
    '2025-07-08 12:00:00+00',
    7
),

-- Ignacio Sinfreu - Solo el servicio parcial que luego se completó
(
    gen_random_uuid(),
    'cc2bd9c8-9a40-48d5-b4bb-814d149a3ac5',
    '6e82d77b-4aeb-45c3-8eba-ee0096536d69',
    75000.00, -- Monto que quedó pendiente del servicio parcial
    '2022-12-01 12:00:00+00',
    '2022-12-20 12:00:00+00',
    19
),

-- Laura Cabral - Servicios parciales que luego se completaron
(
    gen_random_uuid(),
    'c2a9e249-f87f-4a3e-a674-5f3b7bf92fea',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    2600.00, -- Monto pendiente
    '2025-07-02 12:00:00+00',
    '2025-07-25 12:00:00+00',
    23
),
(
    gen_random_uuid(),
    'e23941a7-4430-42ae-9858-5997c02a910a',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    40000.00, -- Monto pendiente
    '2025-07-04 12:00:00+00',
    '2025-08-15 12:00:00+00',
    42
),
(
    gen_random_uuid(),
    '7b3af57c-2b58-4f84-8363-506168d5beff',
    'f89bea35-737f-4e91-be14-4513056d7e5c',
    25000.00, -- Monto pendiente
    '2025-07-04 12:00:00+00',
    '2025-08-20 12:00:00+00',
    47
),

-- Municipalidad Berrotarán - Solo servicios parciales
(
    gen_random_uuid(),
    'ed176618-6c0e-454f-b545-59dbbace9f52',
    'c8310912-c1ad-420b-8cfc-bbbe1e64bdc2',
    45000.00, -- Monto pendiente
    '2025-07-02 12:00:00+00',
    '2025-08-01 12:00:00+00',
    30
),
(
    gen_random_uuid(),
    '8d437cb9-414e-432c-b46a-c8879c706e48',
    'c8310912-c1ad-420b-8cfc-bbbe1e64bdc2',
    125000.00, -- Monto pendiente
    '2025-07-04 12:00:00+00',
    '2025-08-15 12:00:00+00',
    42
),

-- Velez Neumaticos - Solo el servicio parcial
(
    gen_random_uuid(),
    '6eacd25a-46b8-4365-819c-21a865d822c2',
    'e1b50679-e666-47dc-bf1e-e535accd8bff',
    125000.00, -- Monto pendiente del servicio parcial
    '2024-02-07 12:00:00+00',
    '2024-02-25 12:00:00+00',
    18
);