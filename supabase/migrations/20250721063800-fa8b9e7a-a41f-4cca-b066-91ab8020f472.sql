-- Verificar la función del trigger
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_debt_on_payment';

-- Verificar si el trigger existe y está configurado correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_debt_on_payment';

-- Hacer una prueba para ver si el trigger funciona ahora
-- Simular el comportamiento esperado del trigger para verificar la lógica