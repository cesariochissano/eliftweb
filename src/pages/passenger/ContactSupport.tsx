import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';

export default function ContactSupport() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we passed state (e.g. from Trip details)
    const { tripId, initialSubject, reportType } = location.state || {};

    const [subject, setSubject] = useState(initialSubject || '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Pre-fill subject based on report type if provided
    useEffect(() => {
        if (reportType === 'forgot_item') setSubject('Esqueci um item na viagem');
        if (reportType === 'driver_issue') setSubject('Problema com o motorista');
        if (reportType === 'vehicle_issue') setSubject('Problema com o veículo');
        if (reportType === 'other') setSubject('Outro assunto');
    }, [reportType]);

    const handleSubmit = async () => {
        if (!message) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase.from('support_tickets').insert({
                user_id: user.id,
                subject: subject || 'Suporte Geral',
                message,
                trip_id: tripId || null,
                status: 'OPEN',
                type: reportType || 'general'
            });

            if (!error) {
                setSuccess(true);
            }
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Send size={32} className="text-[#3ae012]" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Mensagem Enviada!</h2>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Recebemos o seu pedido de suporte. Entraremos em contacto brevemente.</p>
                <Button className="w-full h-14 rounded-2xl bg-[#101b0d] text-white hover:bg-black font-bold" onClick={() => navigate(-1)}>
                    Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-bold text-black">Conte mais</h1>
                <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6">

                {reportType === 'forgot_item' && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-[#101b0d] mb-2">Esqueci algum item</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Se perdeu um item, será necessário enviar-nos uma mensagem imediatamente,
                            lembrando-se de nos fornecer o máximo de detalhes possível sobre o item perdido e a viagem que fez.
                            Se o encontrarmos, entraremos em contacto diretamente com o motorista para o recuperar.
                        </p>
                    </div>
                )}

                <div className="mb-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                            CONTE-NOS
                        </label>
                        <textarea
                            className="w-full h-40 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl p-4 text-sm resize-none transition-all outline-none"
                            placeholder="A sua mensagem aqui..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="p-6 pb-safe bg-white border-t border-gray-50">
                <Button
                    className="w-full h-14 rounded-2xl bg-[#3ae012] text-white hover:bg-[#2db50e] font-bold shadow-lg shadow-green-500/20 text-lg"
                    disabled={!message || loading}
                    onClick={handleSubmit}
                >
                    {loading ? 'A enviar...' : 'Enviar'}
                </Button>
            </div>
        </div>
    );
}
