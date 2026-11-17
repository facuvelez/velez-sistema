-- Create admin user manually
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@crm.app',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin","role":"Administrator"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Create the corresponding profile
INSERT INTO public.profiles (user_id, username, role)
SELECT id, 'admin', 'Administrator'::user_role
FROM auth.users 
WHERE email = 'admin@crm.app';