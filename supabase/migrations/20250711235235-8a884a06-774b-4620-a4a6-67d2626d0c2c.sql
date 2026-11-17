-- Debug and fix the create_user_simple function
CREATE OR REPLACE FUNCTION public.create_user_simple(
    user_name text, 
    user_password text, 
    user_role public.user_role DEFAULT 'Operator'::public.user_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    email_address text;
    password_hash text;
    user_exists boolean;
    result json;
BEGIN
    -- Debug: Check if username already exists
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = user_name) INTO user_exists;
    
    -- Log the check result
    RAISE LOG 'Username % exists: %', user_name, user_exists;
    
    IF user_exists THEN
        RETURN json_build_object('success', false, 'error', 'El usuario ya existe');
    END IF;
    
    -- Generate a unique email based on username and timestamp to avoid conflicts
    email_address := user_name || '_' || extract(epoch from now())::bigint || '@internal.app';
    
    -- Create a simple hash
    password_hash := '$2a$10$' || md5(user_password || email_address || 'salt');
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email_address,
        password_hash,
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('username', user_name, 'role', user_role),
        now(),
        now()
    ) RETURNING id INTO new_user_id;
    
    -- Insert into profiles
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (new_user_id, user_name, user_role);
    
    RAISE LOG 'User % created successfully with ID %', user_name, new_user_id;
    
    -- Return success with user info
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'username', user_name,
        'email', email_address
    );
    
    RETURN result;
EXCEPTION
    WHEN unique_violation THEN
        RAISE LOG 'Unique violation for user %', user_name;
        RETURN json_build_object('success', false, 'error', 'El usuario ya existe (unique violation)');
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user %: %', user_name, SQLERRM;
        RETURN json_build_object('success', false, 'error', 'Error al crear usuario: ' || SQLERRM);
END;
$$;