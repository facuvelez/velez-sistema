-- Update the update_user_password function to use the same hash method as create_user_simple
DROP FUNCTION IF EXISTS public.update_user_password(text, text);

CREATE OR REPLACE FUNCTION public.update_user_password(username_param text, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email text;
    password_hash text;
BEGIN
    -- Get the user's email from auth.users by joining with profiles
    SELECT u.email INTO user_email
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.username = username_param;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado con username: %', username_param;
    END IF;
    
    -- Create hash using the same method as create_user_simple
    password_hash := '$2a$10$' || md5(new_password || user_email || 'salt');
    
    -- Update the encrypted password for the user
    UPDATE auth.users 
    SET encrypted_password = password_hash,
        updated_at = now()
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error al actualizar la contraseña';
    END IF;
    
    RAISE LOG 'Password updated successfully for user: %', username_param;
END;
$$;