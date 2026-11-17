-- Crear el enum user_role que falta
CREATE TYPE public.user_role AS ENUM ('Administrator', 'Secretary', 'Operator');

-- Actualizar la tabla profiles para usar el enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Recrear el trigger para crear perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Operator'::user_role)
    );
    
    RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();