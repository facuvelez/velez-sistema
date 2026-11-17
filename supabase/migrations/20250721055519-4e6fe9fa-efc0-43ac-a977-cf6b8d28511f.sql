-- Crear el trigger para actualizar la deuda cuando se hace un pago
CREATE TRIGGER trigger_update_debt_on_payment
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();