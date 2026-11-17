-- Permitir que los Operadores puedan crear clientes
CREATE POLICY "Operators can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = 'Operator'::user_role);

-- Nota: Los operadores ya pueden ver clientes (política existente "Operators can view clients")