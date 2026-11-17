-- Update the trigger to handle user creation properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log what we receive
    RAISE LOG 'NEW.id: %', NEW.id;
    RAISE LOG 'NEW.raw_user_meta_data: %', NEW.raw_user_meta_data;
    RAISE LOG 'username from metadata: %', NEW.raw_user_meta_data->>'username';
    RAISE LOG 'role from metadata: %', NEW.raw_user_meta_data->>'role';
    
    -- Insert the profile with proper role handling
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user'),
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.user_role, 
            'Operator'::public.user_role
        )
    )
    ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        role = EXCLUDED.role;
    
    RAISE LOG 'Profile inserted/updated successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        -- Don't fail the user creation if profile creation fails
        RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();