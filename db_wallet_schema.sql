-- =============================================
-- eLift Wallet System - Phase 4 (Secure Ledger)
-- =============================================

-- 1. Create Wallets Table
create table if not exists wallets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    balance numeric(12, 2) default 0.00 not null,
    currency varchar(3) default 'MZN',
    status varchar(20) default 'active' check (status in ('active', 'frozen')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id)
);

-- 2. Create Transactions Table (The Immutable Ledger)
create table if not exists transactions (
    id uuid primary key default gen_random_uuid(),
    wallet_id uuid references wallets(id) not null,
    amount numeric(12, 2) not null, -- Positive = Credit, Negative = Debit
    type varchar(50) not null check (type in ('TRIP_PAYMENT', 'TOPUP', 'WITHDRAWAL', 'COMMISSION_DEDUCTION', 'REFUND')),
    reference_id uuid, -- Can be trip_id or external reference
    description text,
    status varchar(20) default 'COMPLETED' check (status in ('PENDING', 'COMPLETED', 'FAILED')),
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table wallets enable row level security;
alter table transactions enable row level security;

-- Policies
create policy "Users can view own wallet" on wallets
    for select using (auth.uid() = user_id);

create policy "Users can view own transactions" on transactions
    for select using (wallet_id in (select id from wallets where user_id = auth.uid()));

-- =============================================
-- RPC Functions (Secure Logic)
-- =============================================

-- RPC 1: Initialize Wallet (Safe to call multiple times)
create or replace function create_wallet_if_not_exists()
returns void as $$
begin
    insert into wallets (user_id)
    values (auth.uid())
    on conflict (user_id) do nothing;
end;
$$ language plpgsql security definer;

-- RPC 2: Top Up Wallet (Simulated M-Pesa)
-- In a real scenario, this would be called by a webhook with a secret service key.
-- For this MVP, we allow authenticated users to top up (Simulated).
create or replace function simulate_topup(amount numeric)
returns json as $$
declare
    v_wallet_id uuid;
    v_new_balance numeric;
begin
    -- Get Wallet
    select id into v_wallet_id from wallets where user_id = auth.uid();
    if v_wallet_id is null then
        insert into wallets (user_id) values (auth.uid()) returning id into v_wallet_id;
    end if;

    -- Update Balance
    update wallets
    set balance = balance + amount, updated_at = now()
    where id = v_wallet_id
    returning balance into v_new_balance;

    -- Record Transaction
    insert into transactions (wallet_id, amount, type, description, status)
    values (v_wallet_id, amount, 'TOPUP', 'Carregamento M-Pesa (Simulado)', 'COMPLETED');

    return json_build_object('success', true, 'new_balance', v_new_balance);
end;
$$ language plpgsql security definer;

-- RPC 3: Process Trip Payment (Atomic Transfer)
-- Transfers from Passenger -> Driver
-- This function executes two potential actions:
-- 1. Deduct from Passenger
-- 2. Credit to Driver (if online transaction) OR just record cash usage logic if needed.
-- Usage: Called when a trip is completed with WALLET method.
create or replace function process_trip_payment(
    p_trip_id uuid,
    p_driver_id uuid,
    p_amount numeric
)
returns json as $$
declare
    v_passenger_wallet_id uuid;
    v_driver_wallet_id uuid;
    v_passenger_balance numeric;
begin
    -- 1. Get Passenger Wallet
    select id, balance into v_passenger_wallet_id, v_passenger_balance
    from wallets
    where user_id = auth.uid();

    if v_passenger_wallet_id is null then
        return json_build_object('success', false, 'error', 'Wallet not found');
    end if;

    -- 2. Check Balance
    if v_passenger_balance < p_amount then
        return json_build_object('success', false, 'error', 'Insufficient funds');
    end if;

    -- 3. Get Driver Wallet
    select id into v_driver_wallet_id from wallets where user_id = p_driver_id;
    -- Auto-create driver wallet if missing
    if v_driver_wallet_id is null then
        insert into wallets (user_id) values (p_driver_id) returning id into v_driver_wallet_id;
    end if;

    -- 4. Perform Transfer (Atomic)
    -- Deduct from Passenger
    update wallets set balance = balance - p_amount, updated_at = now() where id = v_passenger_wallet_id;
    insert into transactions (wallet_id, amount, type, reference_id, description)
    values (v_passenger_wallet_id, -p_amount, 'TRIP_PAYMENT', p_trip_id, 'Pagamento de Viagem');

    -- Credit to Driver
    update wallets set balance = balance + p_amount, updated_at = now() where id = v_driver_wallet_id;
    insert into transactions (wallet_id, amount, type, reference_id, description)
    values (v_driver_wallet_id, p_amount, 'TRIP_PAYMENT', p_trip_id, 'Recebimento de Viagem');

    return json_build_object('success', true);
exception
    when others then
        return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;

-- RPC 4: Deduct Commission
-- Called automatically or manually to charge the platform fee
create or replace function deduct_commission(
    p_driver_id uuid,
    p_amount numeric,
    p_trip_id uuid
)
returns json as $$
declare
    v_wallet_id uuid;
begin
    select id into v_wallet_id from wallets where user_id = p_driver_id;
    
    if v_wallet_id is null then
        insert into wallets (user_id) values (p_driver_id) returning id into v_wallet_id;
    end if;

    -- Deduct
    update wallets set balance = balance - p_amount, updated_at = now() where id = v_wallet_id;
    
    -- Record Transaction
    insert into transactions (wallet_id, amount, type, reference_id, description)
    values (v_wallet_id, -p_amount, 'COMMISSION_DEDUCTION', p_trip_id, 'Comissão da Plataforma');

    return json_build_object('success', true);
end;
$$ language plpgsql security definer;
