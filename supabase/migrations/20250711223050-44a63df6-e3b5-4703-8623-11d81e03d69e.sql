-- Verificar y recrear la función del trigger con un enfoque más simple
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_value text;
    role_value user_role;
BEGIN
    -- Extraer username de metadata o usar 'user' por defecto
    username_value := COALESCE(NEW.raw_user_meta_data->>'username', 'user');
    
    -- Extraer role de metadata o usar 'Operator' por defecto
    role_value := CASE 
        WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
            (NEW.raw_user_meta_data->>'role')::user_role
        ELSE
            'Operator'::user_role
    END;
    
    -- Insertar el perfil
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (NEW.id, username_value, role_value);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error y re-lanzarlo
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RAISE;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();