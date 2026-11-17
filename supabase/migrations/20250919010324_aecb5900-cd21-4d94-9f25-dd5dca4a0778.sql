-- Agregar el pago restante para completar la deuda de Carlos Alvarado y generar el historial
INSERT INTO public.debt_payments (
    debt_id,
    amount,
    payment_method,
    payment_date,
    notes
) VALUES (
    'd7db6fc9-6c29-4e50-afdd-5565457b7ad2',  -- ID de la deuda existente
    4500.00,  -- Monto restante para completar la deuda
    'Efectivo',
    '2025-07-10',  -- Fecha posterior al primer pago
    'Pago final para completar la deuda'
);