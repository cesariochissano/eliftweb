-- Database Migration: Block 4.3 - Assignments (Driver x Vehicle)
-- Adds fleet_id to assignments and implements RLS policies.

-- 1. Ensure Table Exists (based on original schema)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.profiles(id) NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE', 'ENDED')) DEFAULT 'ACTIVE',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add fleet_id for Multi-tenancy
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);

-- 3. Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Fleet Owners
-- Owners can manage (CRUD) all assignments in their fleet
DROP POLICY IF EXISTS "Assignments: Fleet owners manage own assignments" ON public.assignments;
CREATE POLICY "Assignments: Fleet owners manage own assignments" ON public.assignments
    FOR ALL USING (
        fleet_id IN (SELECT id FROM public.fleets WHERE owner_id = auth.uid())
    );

-- 5. Policies for Drivers
-- Drivers can view their own assignments
DROP POLICY IF EXISTS "Assignments: Drivers view own assignments" ON public.assignments;
CREATE POLICY "Assignments: Drivers view own assignments" ON public.assignments
    FOR SELECT USING (
        driver_id = auth.uid()
    );

-- 6. Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
    END IF;
END $$;

-- 7. Reload Config
NOTIFY pgrst, 'reload config';
