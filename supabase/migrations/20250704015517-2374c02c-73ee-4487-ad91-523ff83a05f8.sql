-- Create storage bucket for cheque images
INSERT INTO storage.buckets (id, name, public) VALUES ('cheques', 'cheques', true);

-- Create storage policies for cheque images
CREATE POLICY "Cheque images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cheques');

CREATE POLICY "Anyone can upload cheque images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cheques');

CREATE POLICY "Anyone can update cheque images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cheques');

-- Create cheques table
CREATE TABLE public.cheques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  service_id UUID,
  debt_payment_id UUID,
  bank_name TEXT NOT NULL,
  cheque_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  issuance_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  holder_name TEXT NOT NULL,
  cbu_number TEXT,
  status TEXT NOT NULL DEFAULT 'En cartera' CHECK (status IN ('En cartera', 'Depositado', 'Cobrado', 'Rechazado')),
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_cheque_number_bank UNIQUE (bank_name, cheque_number)
);

-- Enable Row Level Security
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;

-- Create policies for cheques
CREATE POLICY "Public access to cheques" 
ON public.cheques 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.cheques 
ADD CONSTRAINT cheques_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.cheques 
ADD CONSTRAINT cheques_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE public.cheques 
ADD CONSTRAINT cheques_debt_payment_id_fkey 
FOREIGN KEY (debt_payment_id) REFERENCES public.debt_payments(id) ON DELETE SET NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cheques_updated_at
BEFORE UPDATE ON public.cheques
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_cheques_client_id ON public.cheques(client_id);
CREATE INDEX idx_cheques_status ON public.cheques(status);
CREATE INDEX idx_cheques_payment_date ON public.cheques(payment_date);