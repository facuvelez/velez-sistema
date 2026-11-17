-- Actualizar contraseñas para Jani y Facu
UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('jani' || email || 'salt')
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username = 'Jani'
);

UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('facu' || email || 'salt')
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username = 'Facu'
);

-- Verificar que las contraseñas estén actualizadas
UPDATE auth.users 
SET updated_at = now()
WHERE id IN (
  SELECT user_id FROM public.profiles WHERE username IN ('Jani', 'Facu')
);