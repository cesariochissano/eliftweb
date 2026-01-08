-- Add tip_amount column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Optional: Update transactions if we want to track tip type distinctly, 
-- but 'CREDIT' with description 'Gorjeta' is sufficient for now.
