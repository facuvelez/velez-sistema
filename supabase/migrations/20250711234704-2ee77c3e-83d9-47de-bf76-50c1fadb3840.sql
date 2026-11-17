-- Create simplified authentication functions that avoid email conflicts
-- Function to create user with just username and password
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
    result json;
BEGIN
    -- Generate a unique email based on username and timestamp to avoid conflicts
    email_address := user_name || '_' || extract(epoch from now())::bigint || '@internal.app';
    
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
        crypt(user_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('username', user_name, 'role', user_role),
        now(),
        now()
    ) RETURNING id INTO new_user_id;
    
    -- Insert into profiles
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (new_user_id, user_name, user_role);
    
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
        RETURN json_build_object('success', false, 'error', 'El usuario ya existe');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Error al crear usuario: ' || SQLERRM);
END;
$$;

-- Function to authenticate with username and password
CREATE OR REPLACE FUNCTION public.authenticate_user(user_name text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record record;
    auth_record record;
    result json;
BEGIN
    -- Find user by username
    SELECT p.*, u.email, u.encrypted_password
    INTO user_record
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.username = user_name;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    -- Verify password
    IF user_record.encrypted_password = crypt(user_password, user_record.encrypted_password) THEN
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