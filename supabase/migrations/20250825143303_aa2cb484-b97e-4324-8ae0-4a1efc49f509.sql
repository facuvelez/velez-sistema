-- Fix remaining function search_path security issues

CREATE OR REPLACE FUNCTION public.update_user_password(user_email text, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the encrypted password for the user
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado con email: %', user_email;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    service_record RECORD;
BEGIN
    -- Update the remaining amount on the debt by subtracting the payment
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- Get the service_id before potentially deleting the debt
    SELECT service_id INTO service_record FROM public.debts WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, remove it
    DELETE FROM public.debts 
    WHERE id = NEW.debt_id AND remaining_amount <= 0;
    
    -- Update service status 
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    updated_at = now()
    WHERE id = service_record.service_id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fix_debt_calculations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    debt_record RECORD;
    total_payments DECIMAL(10,2);
BEGIN
    -- Iterar sobre todas las deudas que tienen pagos
    FOR debt_record IN 
        SELECT DISTINCT d.id, d.original_amount
        FROM public.debts d
        INNER JOIN public.debt_payments dp ON d.id = dp.debt_id
    LOOP
        -- Calcular el total de pagos para esta deuda
        SELECT COALESCE(SUM(amount), 0) INTO total_payments
        FROM public.debt_payments
        WHERE debt_id = debt_record.id;
        
        -- Actualizar el remaining_amount
        UPDATE public.debts 
        SET remaining_amount = debt_record.original_amount - total_payments,
            updated_at = now()
        WHERE id = debt_record.id;
        
        -- Si la deuda está completamente pagada, eliminarla
        IF (debt_record.original_amount - total_payments) <= 0 THEN
            DELETE FROM public.debts WHERE id = debt_record.id;
        END IF;
        
        RAISE NOTICE 'Corregida deuda %: original=%, pagos=%, restante=%', 
                     debt_record.id, 
                     debt_record.original_amount, 
                     total_payments, 
                     (debt_record.original_amount - total_payments);
    END LOOP;
    
    RAISE NOTICE 'Corrección de cálculos completada';
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_simple(user_name text, user_password text, user_role user_role DEFAULT 'Operator'::user_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.authenticate_user(user_name text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record record;
    expected_hash text;
    result json;
BEGIN
    -- Find user by username (case-insensitive comparison)
    SELECT p.*, u.email, u.encrypted_password
    INTO user_record
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE LOWER(p.username) = LOWER(user_name);
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    -- Generate expected hash
    expected_hash := '$2a$10$' || md5(user_password || user_record.email || 'salt');
    
    -- Verify password
    IF user_record.encrypted_password = expected_hash THEN
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

CREATE OR REPLACE FUNCTION public.get_user_email_by_username(username_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_service_debt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Calculate pending amount
    DECLARE
        pending_amount DECIMAL(10,2);
    BEGIN
        pending_amount := NEW.total_amount - NEW.amount_delivered;
        
        -- Solo crear deudas si:
        -- 1. El servicio NO está en estado 'pending' con amount_delivered = 0 (servicios de operarios)
        -- 2. Hay un monto pendiente
        IF pending_amount > 0 AND NOT (NEW.status = 'pending' AND NEW.amount_delivered = 0) THEN
            INSERT INTO public.debts (client_id, service_id, original_amount, remaining_amount)
            VALUES (NEW.client_id, NEW.id, pending_amount, pending_amount)
            ON CONFLICT (service_id) 
            DO UPDATE SET 
                remaining_amount = pending_amount,
                updated_at = now();
        ELSE
            -- Si no hay monto pendiente o es un servicio pendiente de operario, eliminar cualquier deuda existente
            DELETE FROM public.debts WHERE service_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_debt_and_sync_service()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Update service status when debt is deleted
    UPDATE public.services 
    SET status = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND id != OLD.id AND remaining_amount > 0) THEN 'paid'::service_status
        ELSE 'partial'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT SUM(remaining_amount) FROM public.debts WHERE service_id = services.id AND id != OLD.id), 0),
    updated_at = now()
    WHERE id = OLD.service_id;
    
    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_debt(debt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    service_id_var UUID;
BEGIN
    -- Get service_id before deleting
    SELECT service_id INTO service_id_var FROM public.debts WHERE id = debt_id_param;
    
    -- Delete the debt
    DELETE FROM public.debts WHERE id = debt_id_param;
    
    -- Update service status
    UPDATE public.services 
    SET status = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.debts WHERE service_id = service_id_var AND remaining_amount > 0) THEN 'paid'::service_status
        ELSE 'partial'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT SUM(remaining_amount) FROM public.debts WHERE service_id = service_id_var), 0),
    updated_at = now()
    WHERE id = service_id_var;
END;
$$;