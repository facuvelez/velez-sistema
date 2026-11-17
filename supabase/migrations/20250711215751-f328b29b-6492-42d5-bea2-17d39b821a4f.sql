-- Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_username text;
    user_role user_role;
BEGIN
    -- Extract username safely
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username', 
        split_part(NEW.email, '@', 1),
        'user'
    );
    
    -- Extract role safely
    BEGIN
        user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Operator'::user_role);
    EXCEPTION WHEN OTHERS THEN
        user_role := 'Operator'::user_role;
    END;
    
    -- Insert into profiles with error handling
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (NEW.id, user_username, user_role);
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();