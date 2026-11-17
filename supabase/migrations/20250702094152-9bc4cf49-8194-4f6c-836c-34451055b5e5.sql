-- Fix the update_debt_on_payment function to handle service status correctly
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the remaining amount on the debt
    UPDATE public.debts 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.debt_id;
    
    -- If debt is fully paid, remove it
    DELETE FROM public.debts 
    WHERE id = NEW.debt_id AND remaining_amount <= 0;
    
    -- Update service status based on remaining debt
    UPDATE public.services 
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id AND remaining_amount > 0) THEN 'partial'::service_status
        ELSE 'paid'::service_status
    END,
    amount_delivered = total_amount - COALESCE((SELECT remaining_amount FROM public.debts WHERE service_id = services.id), 0),
    updated_at = now()
    WHERE id = (SELECT service_id FROM public.debts WHERE id = NEW.debt_id);
    
    RETURN NEW;
END;
$function$;