-- Add Echeq to the payment_method enum
ALTER TYPE payment_method ADD VALUE 'Echeq';

-- Add a field to distinguish between traditional cheques and digital cheques (Echeqs)
ALTER TABLE public.cheques ADD COLUMN cheque_type text NOT NULL DEFAULT 'Cheque';

-- Update existing records to specify they are traditional cheques
UPDATE public.cheques SET cheque_type = 'Cheque' WHERE cheque_type IS NULL OR cheque_type = '';

-- Add comment to clarify the field usage
COMMENT ON COLUMN public.cheques.cheque_type IS 'Type of cheque: Cheque (traditional) or Echeq (digital)';