-- Database Migration: Block 4.5 - Fleet Financial Rates
-- Adds commission configuration to fleets.

-- 1. Add owner_commission_rate (percentage, e.g. 10.00 for 10%)
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS owner_commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- 2. Reload Config
NOTIFY pgrst, 'reload config';
