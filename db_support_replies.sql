-- Database Migration: Support Ticket Replies
CREATE TABLE IF NOT EXISTS public.support_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins: Manage all replies" ON public.support_replies
    FOR ALL USING (public.is_admin(auth.uid()));

-- Users can view and add replies to their OWN tickets
CREATE POLICY "Users: View own ticket replies" ON public.support_replies
    FOR SELECT USING (
        ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
    );

CREATE POLICY "Users: Reply to own tickets" ON public.support_replies
    FOR INSERT WITH CHECK (
        ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
    );

-- Reload config
NOTIFY pgrst, 'reload config';
