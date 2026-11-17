-- Create debt_history table to track fully paid debts
CREATE TABLE public.debt_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID NOT NULL,
    service_id UUID NOT NULL,
    client_id UUID NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    debt_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fully_paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    days_to_cancel INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_history ENABLE ROW LEVEL SECURITY;

-- Create policies for debt_history
CREATE POLICY "Allow anon write access to debt_history" 
ON public.debt_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Administrators and Secretaries can manage debt history" 
ON public.debt_history 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['Administrator'::user_role, 'Secretary'::user_role]));

CREATE POLICY "Allow authenticated anon access to debt_history" 
ON public.debt_history 
FOR SELECT 
USING (true);

-- Update the debt payment trigger to create history records
CREATE OR REPLACE FUNCTION public.update_debt_on_payment_with_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    service_record RECORD;
    debt_record RECORD;
BEGIN
    -- Get debt information before updating
    SELECT * INTO debt_record FROM public.debts WHERE id = NEW.debt_id;
    
    -- Update the remaining amount on the debt by subtracting the payment
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- Get the service_id before potentially deleting the debt
    SELECT service_id INTO service_record FROM public.debts WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, create history record and remove debt
    IF (debt_record.remaining_amount - NEW.amount) <= 0 THEN
        -- Calculate days to cancel
        INSERT INTO public.debt_history (
            debt_id,
            service_id,
            client_id,
            original_amount,
            debt_created_at,
            fully_paid_at,
            days_to_cancel
        ) VALUES (
            NEW.debt_id,
            debt_record.service_id,
            debt_record.client_id,
            debt_record.original_amount,
            debt_record.created_at,
            NEW.payment_date::timestamp with time zone,
            EXTRACT(DAYS FROM (NEW.payment_date::timestamp with time zone - debt_record.created_at))::integer
        );
        
        -- Remove the fully paid debt
        DELETE FROM public.debts WHERE id = NEW.debt_id;
    END IF;
    
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
$function$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS update_debt_on_payment ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment_with_history();

-- Function to calculate average debt cancellation days for a client
CREATE OR REPLACE FUNCTION public.get_client_avg_debt_cancellation_days(client_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    avg_days DECIMAL(10,2);
    total_debts INTEGER;
    result JSON;
BEGIN
    -- Calculate average and count
    SELECT AVG(days_to_cancel), COUNT(*) 
    INTO avg_days, total_debts
    FROM public.debt_history 
    WHERE client_id = client_uuid;
    
    -- Handle case with no history
    IF total_debts = 0 THEN
        result := json_build_object(
            'average_days', null,
            'total_paid_debts', 0,
            'category', 'sin_historial'
        );
    ELSE
        result := json_build_object(
            'average_days', ROUND(avg_days, 1),
            'total_paid_debts', total_debts,
            'category', CASE 
                WHEN avg_days <= 7 THEN 'rapido'
                WHEN avg_days <= 30 THEN 'normal'
                ELSE 'lento'
            END
        );
    END IF;
    
    RETURN result;
END;
$function$;