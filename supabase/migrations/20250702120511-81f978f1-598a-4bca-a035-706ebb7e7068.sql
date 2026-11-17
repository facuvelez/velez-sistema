-- Add category field to distinguish between service and sale
ALTER TABLE public.services 
ADD COLUMN category TEXT NOT NULL DEFAULT 'servicio';

-- Update existing records to be 'servicio' by default
UPDATE public.services 
SET category = 'servicio' 
WHERE category IS NULL OR category = '';

-- Add check constraint for category values
ALTER TABLE public.services 
ADD CONSTRAINT category_check CHECK (category IN ('servicio', 'venta'));