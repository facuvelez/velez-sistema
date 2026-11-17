-- Crear trigger para actualizar deudas automáticamente cuando se agregan pagos
CREATE TRIGGER trigger_update_debt_on_payment
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

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
  (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id) as total_payments,
  (d.original_amount - COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id), 0)) as calculated_remaining
FROM debts d 
WHERE d.id = 'f93992a0-eba7-4797-9832-e4ed58125b34';