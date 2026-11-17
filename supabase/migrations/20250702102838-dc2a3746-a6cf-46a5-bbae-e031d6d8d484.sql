-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT NOT NULL,
  vehicle_info TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_1h BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Appointments are viewable by everyone" 
ON public.appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Appointments can be created by everyone" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Appointments can be updated by everyone" 
ON public.appointments 
FOR UPDATE 
USING (true);

CREATE POLICY "Appointments can be deleted by everyone" 
ON public.appointments 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on date queries
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_reminders ON public.appointments(reminder_sent_24h, reminder_sent_1h, appointment_date);