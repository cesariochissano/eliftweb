-- Add coordinate columns to trips table for map history
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin_lng DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS dest_lat DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS dest_lng DOUBLE PRECISION;

-- Note: No data migration needed for old rows, they will just have NULL coordinates.
