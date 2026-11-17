-- Crear un pago de prueba mínimo para verificar si el trigger funciona
INSERT INTO public.debt_payments (debt_id, amount, payment_method, payment_date, notes)
VALUES ('f93992a0-eba7-4797-9832-e4ed58125b34', 1, 'Efectivo', CURRENT_DATE, 'Pago de prueba para verificar trigger');

-- Verificar si el trigger actualizó correctamente la deuda
SELECT 
  d.id,
  d.original_amount,
  d.remaining_amount,
  d.updated_at,
  (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id) as total_payments,
  (d.original_amount - (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id)) as should_be_remaining
FROM debts d 
WHERE d.id = 'f93992a0-eba7-4797-9832-e4ed58125b34';

-- Eliminar el pago de prueba después de verificar
DELETE FROM public.debt_payments 
WHERE debt_id = 'f93992a0-eba7-4797-9832-e4ed58125b34' 
AND amount = 1 
AND notes = 'Pago de prueba para verificar trigger';