-- Migration: Block 7 - Add service type to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'drive';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Update existing trips to 'drive' if null
UPDATE public.trips SET service_type = 'drive' WHERE service_type IS NULL;
