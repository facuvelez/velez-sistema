-- Actualizar contraseñas correctas para Jani y Facu
UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('bondiola25' || email || 'salt')
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username = 'Facu'
);

UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('janigodoy' || email || 'salt')
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username = 'Jani'
);

-- Verificar que las contraseñas estén actualizadas
UPDATE auth.users 
SET updated_at = now()
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username IN ('Jani', 'Facu')
);