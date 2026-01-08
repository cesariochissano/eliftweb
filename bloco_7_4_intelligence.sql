-- BLOCO 7.4 — GESTÃO INTELIGENTE DE PARAGENS, TEMPO DE ESPERA E ANTI-FRAUDE
-- Executar no SQL Editor do Supabase

-- 1. ADICIONAR COLUNAS À TABELA TRIPS
DO $$ 
BEGIN 
    -- Tempo de Espera
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='waiting_time_minutes') THEN
        ALTER TABLE public.trips ADD COLUMN waiting_time_minutes INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='waiting_time_cost') THEN
        ALTER TABLE public.trips ADD COLUMN waiting_time_cost NUMERIC DEFAULT 0;
    END IF;

    -- Paragens
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='stops') THEN
        ALTER TABLE public.trips ADD COLUMN stops JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Segurança e Anti-Fraude
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='security_pin') THEN
        ALTER TABLE public.trips ADD COLUMN security_pin TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='is_critical_zone') THEN
        ALTER TABLE public.trips ADD COLUMN is_critical_zone BOOLEAN DEFAULT FALSE;
    END IF;

    -- Detalhamento de Preço (Somatória X + Y + Z)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='base_price') THEN
        ALTER TABLE public.trips ADD COLUMN base_price NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='route_adjustment_cost') THEN
        ALTER TABLE public.trips ADD COLUMN route_adjustment_cost NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. INICIALIZAR BASE_PRICE PARA VIAGENS EXISTENTES (Se necessário)
UPDATE public.trips SET base_price = price WHERE base_price IS NULL;

-- 3. ÍNDICE PARA SEGURANÇA (Opcional)
CREATE INDEX IF NOT EXISTS idx_trips_pin ON public.trips(security_pin) WHERE security_pin IS NOT NULL;
