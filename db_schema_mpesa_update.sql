-- 1. TRANSACTIONS TABLE (History for Audit)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES auth.users(id) NOT NULL,
    trip_id UUID, -- Optional, if related to a trip
    amount DECIMAL(10, 2) NOT NULL, -- Positive for Credit, Negative for Debit
    type VARCHAR(20) NOT NULL, -- 'CREDIT', 'DEBIT', 'TOPUP', 'WITHDRAWAL'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert transactions (for simulation only - ideally restricted)" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = driver_id);


-- 2. RPC: Increment Balance (Secure way to update balance)
-- Drop if exists to avoid conflicts
DROP FUNCTION IF EXISTS increment_balance;

CREATE OR REPLACE FUNCTION increment_balance(user_id UUID, amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE driver_wallets
  SET 
    balance = balance + amount,
    updated_at = NOW()
  WHERE driver_id = user_id;
  
  -- If row doesn't exist (edge case), insert it
  IF NOT FOUND THEN
    INSERT INTO driver_wallets (driver_id, balance)
    VALUES (user_id, amount);
  END IF;
END;
$$;
