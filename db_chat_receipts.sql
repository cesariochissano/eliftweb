-- Migration: Block 7.2 - Create Messages Table + Receipts (Vistos)

-- 1. Create table if not exist
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'sent', -- 'sending', 'sent', 'delivered', 'read'
  delivered_at timestamp with time zone,
  read_at timestamp with time zone
);

-- 2. Configure RLS (Safe for MVP)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Usage on Messages" ON public.messages;
CREATE POLICY "Public Usage on Messages" ON public.messages FOR ALL USING (true);

-- 3. Configure Realtime
-- Ensure the table is in the publication for instant updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
