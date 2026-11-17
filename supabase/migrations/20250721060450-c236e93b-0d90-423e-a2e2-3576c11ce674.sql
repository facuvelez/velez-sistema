-- Actualizar directamente con el valor correcto (1,500,000 - 160,000 = 1,340,000)
UPDATE public.debts 
SET remaining_amount = 1340000,
    updated_at = now()
WHERE id = 'f93992a0-eba7-4797-9832-e4ed58125b34';

-- Verificar que se haya actualizado
SELECT id, original_amount, remaining_amount, updated_at 
FROM public.debts 
WHERE id = 'f93992a0-eba7-4797-9832-e4ed58125b34';