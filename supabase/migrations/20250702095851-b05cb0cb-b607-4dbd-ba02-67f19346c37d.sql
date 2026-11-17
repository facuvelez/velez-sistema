-- Fix data inconsistency between services and debts

-- First, create missing debts for services with pending amounts
INSERT INTO public.debts (client_id, service_id, original_amount, remaining_amount)
SELECT 
    s.client_id,
    s.id as service_id,
    (s.total_amount - s.amount_delivered) as original_amount,
    (s.total_amount - s.amount_delivered) as remaining_amount
FROM public.services s
LEFT JOIN public.debts d ON s.id = d.service_id
WHERE s.total_amount > s.amount_delivered 
  AND d.id IS NULL  -- No existing debt
  AND (s.total_amount - s.amount_delivered) > 0;

-- Update service statuses to match their actual payment state
UPDATE public.services 
SET status = CASE 
    WHEN amount_delivered >= total_amount THEN 'paid'::service_status
    WHEN amount_delivered > 0 AND amount_delivered < total_amount THEN 'partial'::service_status
    ELSE 'pending'::service_status
END
WHERE status != CASE 
    WHEN amount_delivered >= total_amount THEN 'paid'::service_status
    WHEN amount_delivered > 0 AND amount_delivered < total_amount THEN 'partial'::service_status
    ELSE 'pending'::service_status
END;

-- Ensure we have the correct triggers in place
DROP TRIGGER IF EXISTS manage_service_debt_trigger ON public.services;
CREATE TRIGGER manage_service_debt_trigger
    AFTER INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_service_debt();

DROP TRIGGER IF EXISTS update_debt_on_payment_trigger ON public.debt_payments;
CREATE TRIGGER update_debt_on_payment_trigger
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();