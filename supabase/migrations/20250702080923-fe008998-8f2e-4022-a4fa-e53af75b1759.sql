-- Create enum types for better data consistency
CREATE TYPE client_type AS ENUM ('Persona', 'Empresa');
CREATE TYPE service_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE payment_method AS ENUM ('Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia Bancaria', 'Cheque');

-- Create clients table
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    type client_type NOT NULL DEFAULT 'Persona',
    company_name TEXT,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    vehicle_info TEXT,
    notes TEXT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_delivered DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method payment_method NOT NULL,
    secondary_payment_method payment_method,
    status service_status NOT NULL DEFAULT 'pending',
    responsible_person TEXT,
    company_representative TEXT,
    signature_data TEXT,
    service_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debts table
CREATE TABLE public.debts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    original_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(service_id)
);

-- Create payments table for tracking debt payments
CREATE TABLE public.debt_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all access for now - implement authentication later)
CREATE POLICY "Public access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to debt_payments" ON public.debt_payments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically manage debts when services are created/updated
CREATE OR REPLACE FUNCTION public.manage_service_debt()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate pending amount
    DECLARE
        pending_amount DECIMAL(10,2);
    BEGIN
        pending_amount := NEW.total_amount - NEW.amount_delivered;
        
        -- If there's a pending amount, create or update debt
        IF pending_amount > 0 THEN
            INSERT INTO public.debts (client_id, service_id, original_amount, remaining_amount)
            VALUES (NEW.client_id, NEW.id, pending_amount, pending_amount)
            ON CONFLICT (service_id) 
            DO UPDATE SET 
                remaining_amount = pending_amount,
                updated_at = now();
        ELSE
            -- If no pending amount, remove any existing debt
            DELETE FROM public.debts WHERE service_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage debts
CREATE TRIGGER manage_service_debt_trigger
    AFTER INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_service_debt();

-- Create function to update debt when payments are made
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS TRIGGER AS $$
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
        WHEN EXISTS (SELECT 1 FROM public.debts WHERE service_id = services.id) THEN 'partial'
        ELSE 'paid'
    END,
    amount_delivered = total_amount - COALESCE((SELECT remaining_amount FROM public.debts WHERE service_id = services.id), 0),
    updated_at = now()
    WHERE id = (SELECT service_id FROM public.debts WHERE id = NEW.debt_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for debt payment updates
CREATE TRIGGER update_debt_on_payment_trigger
    AFTER INSERT ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debt_on_payment();

-- Enable realtime for all tables
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.debts REPLICA IDENTITY FULL;
ALTER TABLE public.debt_payments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;