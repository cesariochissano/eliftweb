-- Create Passengers Wallet Table
DROP TABLE IF EXISTS public.passenger_wallets;
CREATE TABLE IF NOT EXISTS public.passenger_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    passenger_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'MZN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.passenger_wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own wallet" ON public.passenger_wallets
    FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Users can update own wallet (via RPC only strictly speaking, but handy for dev)" ON public.passenger_wallets
    FOR UPDATE USING (auth.uid() = passenger_id);

-- Insert wallet for existing users (idempotent)
INSERT INTO public.passenger_wallets (passenger_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT passenger_id FROM public.passenger_wallets);

-- Function to safely increment balance (Transactional)
CREATE OR REPLACE FUNCTION increment_passenger_balance(user_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
    INSERT INTO public.passenger_wallets (passenger_id, balance)
    VALUES (user_id, amount)
    ON CONFLICT (passenger_id)
    DO UPDATE SET balance = passenger_wallets.balance + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
