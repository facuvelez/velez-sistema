-- Fix all users without profiles and confirm emails
-- First, create profiles for users that don't have them
INSERT INTO public.profiles (user_id, username, role)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', 
             CASE 
                 WHEN u.email = 'admin@crm.app' THEN 'admin'
                 WHEN u.email = 'facu@crm.app' THEN 'Facu'
                 WHEN u.email = 'jani@crm.app' THEN 'Jani'
                 WHEN u.email LIKE 'facu_temp@%' THEN 'Facu'
                 ELSE split_part(u.email, '@', 1)
             END),
    COALESCE(
        (u.raw_user_meta_data->>'role')::public.user_role,
        CASE 
            WHEN u.email = 'admin@crm.app' THEN 'Administrator'::public.user_role
            WHEN u.email = 'facu@crm.app' THEN 'Administrator'::public.user_role
            ELSE 'Operator'::public.user_role
        END
    )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- Confirm all user emails
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;