import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ArrowLeft, MessageSquare, CheckCircle, Clock,
    Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [replies, setReplies] = useState<Record<string, any[]>>({});
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('support_tickets')
            .select(`
                *,
                user:user_id (
                    first_name,
                    last_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (data) setTickets(data);
        setLoading(false);
    };

    const fetchReplies = async (ticketId: string) => {
        const { data } = await supabase
            .from('support_replies')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (data) {
            setReplies(prev => ({ ...prev, [ticketId]: data }));
        }
    };

    const handleExpand = (ticketId: string) => {
        if (expandedTicket === ticketId) {
            setExpandedTicket(null);
        } else {
            setExpandedTicket(ticketId);
            fetchReplies(ticketId);
        }
    };

    const handleSendReply = async (ticketId: string) => {
        if (!replyText.trim()) return;
        setSendingReply(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('support_replies')
            .insert({
                ticket_id: ticketId,
                sender_id: user.id,
                message: replyText
            });

        if (!error) {
            setReplyText('');
            fetchReplies(ticketId);
        }
        setSendingReply(false);
    };

    const handleResolve = async (id: string) => {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: 'CLOSED', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            fetchTickets();
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'ALL') return true;
        return t.status === filter;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">Suporte ao Cliente</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'OPEN' ? 'primary' : 'outline'}
                        onClick={() => setFilter('OPEN')}
                        className={`h-8 text-xs ${filter === 'OPEN' ? 'bg-primary text-white border-transparent' : ''}`}
                    >
                        Abertos
                    </Button>
                    <Button
                        variant={filter === 'CLOSED' ? 'primary' : 'outline'}
                        onClick={() => setFilter('CLOSED')}
                        className={`h-8 text-xs ${filter === 'CLOSED' ? 'bg-primary text-white border-transparent' : ''}`}
                    >
                        Fechados
                    </Button>
                    <Button
                        variant={filter === 'ALL' ? 'primary' : 'outline'}
                        onClick={() => setFilter('ALL')}
                        className={`h-8 text-xs ${filter === 'ALL' ? 'bg-primary text-white border-transparent' : ''}`}
                    >
                        Todos
                    </Button>
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-[#3ae012] border-t-transparent rounded-full" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-bold">Nenhum ticket encontrado.</p>
                    </div>
                ) : (
                    filteredTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div
                                className="p-6 flex justify-between items-start cursor-pointer hover:bg-gray-50/50 transition-colors"
                                onClick={() => handleExpand(ticket.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${ticket.status === 'OPEN' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                        {ticket.status === 'OPEN' ? <Clock size={24} /> : <CheckCircle size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            {ticket.user?.first_name} {ticket.user?.last_name} • <span className="text-gray-400 font-normal">{ticket.user?.email}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'OPEN'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {ticket.status === 'OPEN' ? 'Aberto' : 'Resolvido'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-gray-300">
                                    {expandedTicket === ticket.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>

                            {expandedTicket === ticket.id && (
                                <div className="bg-gray-50/50 border-t border-gray-50 p-6 space-y-6 animate-in slide-in-from-top-2">
                                    {/* Conversation Flow */}
                                    <div className="space-y-4">
                                        {/* Original Message */}
                                        <div className="flex flex-col items-start max-w-[80%]">
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-700">
                                                <p className="font-black text-[10px] text-primary uppercase mb-1 tracking-wider">Cliente</p>
                                                {ticket.message}
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-1 ml-1 font-bold">
                                                {new Date(ticket.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        {/* Replies */}
                                        {replies[ticket.id]?.map((reply) => {
                                            const isClient = reply.sender_id === ticket.user_id;
                                            return (
                                                <div key={reply.id} className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}>
                                                    <div className={`p-4 rounded-2xl shadow-sm max-w-[80%] text-sm ${isClient
                                                            ? 'bg-white rounded-tl-none border border-gray-100 text-gray-700'
                                                            : 'bg-primary text-white rounded-tr-none'
                                                        }`}>
                                                        <p className={`font-black text-[10px] uppercase mb-1 tracking-wider ${isClient ? 'text-primary' : 'text-white/60'}`}>
                                                            {isClient ? 'Cliente' : 'Suporte eLift'}
                                                        </p>
                                                        {reply.message}
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 mt-1 mx-1 font-bold">
                                                        {new Date(reply.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Reply Box */}
                                    {ticket.status === 'OPEN' && (
                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="relative group">
                                                <textarea
                                                    rows={3}
                                                    placeholder="Escreva uma resposta para o cliente..."
                                                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 pr-14 text-sm outline-none focus:border-primary transition-all group-hover:border-gray-300 shadow-sm"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleSendReply(ticket.id)}
                                                    disabled={sendingReply || !replyText.trim()}
                                                    className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-bold"
                                                >
                                                    {sendingReply ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Send size={18} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <p className="text-[10px] text-gray-400 font-medium">O cliente receberá uma notificação.</p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-[10px] font-black uppercase text-gray-400 hover:text-green-600 transition-colors"
                                                    onClick={() => handleResolve(ticket.id)}
                                                >
                                                    Encerrar Chamado
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {ticket.status === 'CLOSED' && (
                                        <div className="text-center py-4 text-[11px] font-bold text-gray-400 bg-gray-100/50 rounded-2xl uppercase tracking-widest">
                                            Chamado Encerrado em {new Date(ticket.updated_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
