-- Add uncollectible status to debts table
ALTER TABLE public.debts ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'uncollectible'));

-- Create index for better performance on status queries
CREATE INDEX idx_debts_status ON public.debts (status);

-- Update existing debts to have 'active' status
UPDATE public.debts SET status = 'active' WHERE status IS NULL;