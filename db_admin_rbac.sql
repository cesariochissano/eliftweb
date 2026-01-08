-- Database Migration: Block 5.1 - Admin RBAC (Role-Based Access Control)
-- This script sets up the role system and prepares the DB for Super Admin control.

-- 1. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('PASSENGER', 'DRIVER', 'FLEET_MANAGER', 'SERVICE_ADMIN', 'SUPER_ADMIN');
    END IF;
END $$;

-- 2. UPDATE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'PASSENGER';

-- 3. HELPER FUNCTIONS for RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is any kind of admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = user_uuid) IN ('SERVICE_ADMIN', 'SUPER_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. INITIALIZE SUPER ADMIN
-- Promotion based on the known admin email
UPDATE public.profiles 
SET role = 'SUPER_ADMIN' 
WHERE email = 'admin@elift.com';

-- 5. UPGRADED RLS POLICIES (Example: Fleets)
-- Allowing Super Admins to see EVERY fleet
DROP POLICY IF EXISTS "Fleets: Super Admins view all" ON public.fleets;
CREATE POLICY "Fleets: Super Admins view all" ON public.fleets
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Allowing Super Admins to see EVERY profile
DROP POLICY IF EXISTS "Profiles: Super Admins view all" ON public.profiles;
CREATE POLICY "Profiles: Super Admins view all" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Allowing Super Admins to see EVERY trip
DROP POLICY IF EXISTS "Trips: Super Admins view all" ON public.trips;
CREATE POLICY "Trips: Super Admins view all" ON public.trips
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Allowing Super Admins to see EVERY transaction
DROP POLICY IF EXISTS "Transactions: Super Admins view all" ON public.transactions;
CREATE POLICY "Transactions: Super Admins view all" ON public.transactions
    FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. TRIGGER: Auto-assign role based on driver status (Optional but good)
-- If a profile exists in the drivers table, ensure they are at least a DRIVER role
-- We'll skip for now to keep it explicit.

-- 7. NOTIFY PostgREST
NOTIFY pgrst, 'reload config';
