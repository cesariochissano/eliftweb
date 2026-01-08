-- Database Migration: Add status to fleets
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- Add constraint for valid status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fleets_status_check'
    ) THEN
        ALTER TABLE public.fleets ADD CONSTRAINT fleets_status_check CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING'));
    END IF;
END $$;

-- Update RLS to ensure suspended fleets might have restricted access if needed
-- (Already handled by global SUPER_ADMIN policy, but good to keep in mind)

NOTIFY pgrst, 'reload config';
