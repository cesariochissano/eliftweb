-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DRIVER WALLETS (For managing commissions and balance)
CREATE TABLE IF NOT EXISTS driver_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'MZN',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'BLOCKED' (if balance too low)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PASSENGER WALLETS (Lift Card / Pre-paid)
CREATE TABLE IF NOT EXISTS passenger_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'MZN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROMO CODES
CREATE TYPE discount_type AS ENUM ('PERCENT', 'FIXED_AMOUNT');

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type discount_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL, -- e.g., 10 for 10% or 100 for 100 MZN
    max_uses_global INTEGER, -- NULL = unlimited
    max_uses_per_user INTEGER DEFAULT 1,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROMO CODE USAGE TRACKING
CREATE TABLE IF NOT EXISTS user_promo_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    promo_code_id UUID REFERENCES promo_codes(id) NOT NULL,
    trip_id UUID, -- Optional: link to specific trip where it was used
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Simple examples - refine as needed)

-- Driver Wallets: Drivers can view their own wallet
ALTER TABLE driver_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view own wallet" ON driver_wallets
    FOR SELECT USING (auth.uid() = driver_id);

-- Passenger Wallets: Passengers can view their own wallet
ALTER TABLE passenger_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passengers can view own wallet" ON passenger_wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Promo Codes: Everyone can read active promos (to validate)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active promos" ON promo_codes
    FOR SELECT USING (true); -- In reality, might want to restrict listing all, but allow enabling by exact code match logic in backend
