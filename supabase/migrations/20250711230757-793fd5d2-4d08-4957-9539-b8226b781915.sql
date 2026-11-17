-- Create admin user if it doesn't exist
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Insert user into auth.users table
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@crm.app',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "admin", "role": "Administrator"}',
        false
    ) 
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;

    -- Get the user_id if it already exists
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@crm.app';
    END IF;

    -- Insert profile for admin user
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (admin_user_id, 'admin', 'Administrator'::user_role)
    ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        role = EXCLUDED.role;

    RAISE NOTICE 'Admin user created/updated successfully with user_id: %', admin_user_id;
END $$;