-- Create profiles for existing users
INSERT INTO public.profiles (user_id, username, role)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', 'user'),
    CASE 
        WHEN raw_user_meta_data->>'role' = 'Administrator' THEN 'Administrator'::user_role
        WHEN raw_user_meta_data->>'role' = 'Secretary' THEN 'Secretary'::user_role
        ELSE 'Operator'::user_role
    END
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);