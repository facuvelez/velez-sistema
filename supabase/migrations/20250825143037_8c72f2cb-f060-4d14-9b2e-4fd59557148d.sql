-- Fix critical RLS security issues: Enable RLS on all tables with policies

-- Check current RLS status and enable RLS on all public tables that should have it
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Fix function search_path issues for security definer functions
-- Update existing functions to include proper search_path settings

CREATE OR REPLACE FUNCTION public.sync_all_services_with_debts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Actualizar solo el status basándose en las deudas actuales, SIN tocar amount_delivered
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 
            CASE 
                WHEN amount_delivered > 0 THEN 'partial'::service_status
                ELSE 'pending'::service_status
            END
        ELSE 'paid'::service_status
    END,
    updated_at = now();
    
    RAISE NOTICE 'Sincronización completada para todos los servicios - amount_delivered preservado';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.fix_existing_debt_payment()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
    service_record RECORD;
BEGIN
    -- Buscar todos los pagos que no han actualizado las deudas correctamente
    FOR payment_record IN 
        SELECT dp.*, d.remaining_amount, d.original_amount, d.service_id
        FROM debt_payments dp
        JOIN debts d ON dp.debt_id = d.id
        WHERE d.remaining_amount = d.original_amount -- Deudas que no se han actualizado
    LOOP
        RAISE NOTICE 'Procesando pago de % para deuda %', payment_record.amount, payment_record.debt_id;
        
        -- Actualizar el remaining_amount de la deuda
        UPDATE public.debts 
        SET remaining_amount = remaining_amount - payment_record.amount,
            updated_at = now()
        WHERE id = payment_record.debt_id;
        
        -- Si la deuda está completamente pagada, eliminarla
        DELETE FROM public.debts 
        WHERE id = payment_record.debt_id AND remaining_amount <= 0;
        
        -- Actualizar el estado del servicio
        UPDATE public.services 
        SET status = CASE 
            WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = payment_record.service_id AND remaining_amount > 0) THEN 
                CASE 
                    WHEN amount_delivered > 0 THEN 'partial'::service_status
                    ELSE 'pending'::service_status
                END
            ELSE 'paid'::service_status
        END,
        updated_at = now()
        WHERE id = payment_record.service_id;
        
        RAISE NOTICE 'Deuda % actualizada correctamente', payment_record.debt_id;
    END LOOP;
    
    RAISE NOTICE 'Corrección completada para todas las deudas con pagos pendientes';
END;
$$;