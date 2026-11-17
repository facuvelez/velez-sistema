-- Create function to get user email by username
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(username_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
BEGIN
    SELECT u.email INTO user_email
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.username = username_param;
    
    RETURN user_email;
END;
$$;