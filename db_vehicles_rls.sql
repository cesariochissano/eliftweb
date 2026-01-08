-- Database Migration: Block 4.3 - Vehicle Management (FIXED)
-- Ensures the table exists before applying alterations and RLS.

-- 1. Create table if missing (based on original definition)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    year INT,
    type TEXT DEFAULT 'ECONOMY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add fleet_id to vehicles (if not already there)
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);

-- 3. Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Fleet Owners
-- Owners can manage (CRUD) all vehicles in their fleet
DROP POLICY IF EXISTS "Vehicles: Fleet owners manage own vehicles" ON public.vehicles;
CREATE POLICY "Vehicles: Fleet owners manage own vehicles" ON public.vehicles
    FOR ALL USING (
        fleet_id IN (SELECT id FROM public.fleets WHERE owner_id = auth.uid())
    );

-- 5. Policies for Drivers
-- Drivers can view vehicles in their fleet
DROP POLICY IF EXISTS "Vehicles: Drivers view fleet vehicles" ON public.vehicles;
CREATE POLICY "Vehicles: Drivers view fleet vehicles" ON public.vehicles
    FOR SELECT USING (
        fleet_id IN (SELECT fleet_id FROM public.profiles WHERE id = auth.uid())
    );

-- 6. Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'vehicles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
    END IF;
END $$;

-- 7. Reload Config
NOTIFY pgrst, 'reload config';
