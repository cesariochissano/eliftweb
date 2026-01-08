-- CONSORCIO DE FIXES ELIFT
-- Executar este script no SQL Editor do Supabase para corrigir os erros 400/404 e restrições de status

-- 0. CORRIGIR RESTRIÇÃO DE STATUS (trips_status_check)
DO $$ 
BEGIN 
    -- Remover restrição antiga se existir
    ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
    
    -- Adicionar nova restrição com suporte a ARRIVED
    ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
    CHECK (status IN ('IDLE', 'REQUESTING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
END $$;

-- 1. ADICIONAR COLUNA DE VERSÃO ÀS VIAGENS (Resiliência)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='trip_version') THEN
        ALTER TABLE public.trips ADD COLUMN trip_version INT DEFAULT 1;
    END IF;
END $$;

-- 2. CRIAR TABELA DE EVENTOS (Audit Log)
CREATE TABLE IF NOT EXISTS public.trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL, -- 'PASSENGER', 'DRIVER', 'SYSTEM'
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para eventos
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trip_events' AND policyname='Enable read/insert for authenticated users') THEN
        CREATE POLICY "Enable read/insert for authenticated users" ON public.trip_events FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. CRIAR FUNÇÃO DE SALDO DO MOTORISTA (RPC)
CREATE OR REPLACE FUNCTION get_driver_balance(driver_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(amount), 0) FROM public.wallet_transactions WHERE user_id = driver_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ESTRUTURA DE FROTAS (Se faltar)
CREATE TABLE IF NOT EXISTS public.fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('INDIVIDUAL', 'CORPORATE')),
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar fleet_id aos perfis se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fleet_id') THEN
        ALTER TABLE public.profiles ADD COLUMN fleet_id UUID REFERENCES public.fleets(id);
    END IF;
END $$;

-- 5. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip ON public.trip_events(trip_id);
