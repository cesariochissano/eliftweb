-- FIX: Add missing columns to trips table (Updated)
-- This fixes the "Erro ao solicitar viagem" issue caused by missing schema fields.

-- 1. Add Coordinate Columns (Required for Map History & Trip Request)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin_lat DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin_lng DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS dest_lat DOUBLE PRECISION;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS dest_lng DOUBLE PRECISION;

-- 2. Add Price & Promo Columns (Crucial for Trip Request)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id);

-- 3. Add Tip Amount Column (Required for Tipping Feature)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0.00;

-- 4. Verify Payment Method (Optional)
-- Ensure 'payment_method' column exists (usually text or enum)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'CASH';

-- 5. Force Schema Cache Refresh (Supabase sometimes caches schema)
NOTIFY pgrst, 'reload config';
