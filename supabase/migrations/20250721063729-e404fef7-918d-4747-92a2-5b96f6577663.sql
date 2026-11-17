-- Verificar triggers existentes
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('debt_payments', 'debts')
ORDER BY event_object_table, trigger_name;

-- Corregir manualmente la deuda #1195250440392 
-- Pagos totales: $160.000 + $300.000 + $40.000 = $500.000
-- Saldo correcto: $1.500.000 - $500.000 = $1.000.000

UPDATE public.debts 
SET remaining_amount = 1000000,
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