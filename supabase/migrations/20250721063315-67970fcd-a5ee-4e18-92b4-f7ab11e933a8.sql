-- Corregir manualmente la deuda #1195250440392 que no se actualizó correctamente
-- Monto original: $1.500.000, Pagos: $300.000 + $160.000 = $460.000
-- Saldo correcto: $1.500.000 - $460.000 = $1.040.000

UPDATE public.debts 
SET remaining_amount = 1040000,
    updated_at = now()
WHERE id = 'f93992a0-eba7-4797-9832-e4ed58125b34';

-- Verificar que se haya actualizado correctamente
SELECT 
  d.id,
  d.original_amount,
  d.remaining_amount,
  d.updated_at,
  (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id) as total_payments
FROM debts d 
WHERE d.id = 'f93992a0-eba7-4797-9832-e4ed58125b34';