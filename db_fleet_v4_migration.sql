-- Database Migration: Block 4 - Fleet Management (Corporate vs Individual)
-- This script formalizes the fleet structure and implements RLS for secure multi-tenancy.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fleet_type') THEN
        CREATE TYPE fleet_type AS ENUM ('INDIVIDUAL', 'CORPORATE');
    END IF;
END $$;

-- 3. FLEETS TABLE
CREATE TABLE IF NOT EXISTS public.fleets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type fleet_type DEFAULT 'INDIVIDUAL',
    invite_code VARCHAR(10) UNIQUE,
    legal_name TEXT, -- For Corporate
    nuit TEXT,       -- For Corporate (Tax ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. UPDATE PROFILES & DRIVERS
-- Add fleet_id to profiles to easily identify fleet managers and drivers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);

-- Add fleet-specific flags to drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_salaried BOOLEAN DEFAULT FALSE;

-- Add fleet_id to transactions for easier RLS and reporting
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES public.fleets(id);

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all relevant tables
ALTER TABLE public.fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
-- Transactions table (assuming it exists based on Earnings logic)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES: FLEETS
-- Owners can see and update their own fleet
CREATE POLICY "Fleets: Owners manage own fleet" ON public.fleets
    FOR ALL USING (auth.uid() = owner_id);

-- Drivers can see the fleet they belong to
CREATE POLICY "Fleets: Drivers view own fleet" ON public.fleets
    FOR SELECT USING (id IN (SELECT fleet_id FROM public.profiles WHERE id = auth.uid()));

-- 7. POLICIES: DRIVERS (The isolation core)
-- Fleet Managers can see and update drivers in their fleet
CREATE POLICY "Drivers: Fleet managers view own drivers" ON public.drivers
    FOR ALL USING (
        fleet_id IN (SELECT id FROM public.fleets WHERE owner_id = auth.uid())
    );

-- 8. POLICIES: TRANSACTIONS
-- Fleet Managers can see transactions for their fleet
CREATE POLICY "Transactions: Fleet managers view fleet transactions" ON public.transactions
    FOR SELECT USING (
        fleet_id IN (SELECT id FROM public.fleets WHERE owner_id = auth.uid())
    );

-- 9. FUNCTIONS & TRIGGERS
-- Function to automatically link profiles to fleet if they are a driver in a fleet
CREATE OR REPLACE FUNCTION public.sync_profile_fleet()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET fleet_id = NEW.fleet_id
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_driver_fleet_update ON public.drivers;
CREATE TRIGGER on_driver_fleet_update
    AFTER INSERT OR UPDATE OF fleet_id ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_fleet();

-- 10. NOTIFY PostgREST to reload schema
NOTIFY pgrst, 'reload config';
