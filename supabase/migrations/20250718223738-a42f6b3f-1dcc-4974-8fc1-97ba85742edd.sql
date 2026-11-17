
-- Modificar la función authenticate_user para hacer comparaciones case-insensitive
CREATE OR REPLACE FUNCTION public.authenticate_user(user_name text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record record;
    expected_hash text;
    result json;
BEGIN
    -- Find user by username (case-insensitive comparison)
    SELECT p.*, u.email, u.encrypted_password
    INTO user_record
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE LOWER(p.username) = LOWER(user_name);
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    -- Generate expected hash
    expected_hash := '$2a$10$' || md5(user_password || user_record.email || 'salt');
    
    -- Verify password
    IF user_record.encrypted_password = expected_hash THEN
        RETURN json_build_object(
            'success', true, 
            'user_id', user_record.user_id,
            'username', user_record.username,
            'role', user_record.role,
            'email', user_record.email
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'Contraseña incorrecta');
    END IF;
END;
$$;
