-- Database Migration: Block 4.4 - Trips Multi-tenancy
-- Adds fleet_id to trips and implements RLS policies.

-- 1. Add fleet_id for Multi-tenancy
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);

-- 2. Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Fleet Owners
-- Owners can see all trips associated with their fleet
DROP POLICY IF EXISTS "Trips: Fleet owners view fleet trips" ON public.trips;
CREATE POLICY "Trips: Fleet owners view fleet trips" ON public.trips
    FOR SELECT USING (
        fleet_id IN (SELECT id FROM public.fleets WHERE owner_id = auth.uid())
    );

-- 4. Policies for Passengers
-- (Assuming passenger views their own trips)
DROP POLICY IF EXISTS "Trips: Passengers view own trips" ON public.trips;
CREATE POLICY "Trips: Passengers view own trips" ON public.trips
    FOR ALL USING (passenger_id = auth.uid());

-- 5. Policies for Drivers
-- (Assuming driver views their own trips)
DROP POLICY IF EXISTS "Trips: Drivers view own trips" ON public.trips;
CREATE POLICY "Trips: Drivers view own trips" ON public.trips
    FOR ALL USING (driver_id = auth.uid());

-- 6. Trigger to automatically set fleet_id on new trips
-- This ensures that when a driver creates/accepts a trip, the fleet_id is persisted.
CREATE OR REPLACE FUNCTION public.set_trip_fleet_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fleet_id := (SELECT fleet_id FROM public.drivers WHERE id = NEW.driver_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_create_set_fleet ON public.trips;
CREATE TRIGGER on_trip_create_set_fleet
    BEFORE INSERT ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.set_trip_fleet_id();

-- 7. Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'trips'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
    END IF;
END $$;

-- 8. Reload Config
NOTIFY pgrst, 'reload config';
