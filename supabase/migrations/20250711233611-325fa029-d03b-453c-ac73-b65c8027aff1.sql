-- Create function to update user password
CREATE OR REPLACE FUNCTION public.update_user_password(user_email text, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the encrypted password for the user
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado con email: %', user_email;
    END IF;
END;
$$;