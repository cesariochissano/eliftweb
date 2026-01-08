import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTripStore } from '../../stores/useTripStore';
import { ChevronLeft, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function Promotions() {
    const navigate = useNavigate();
    const { setActivePromo } = useTripStore();
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleApply = async () => {
        if (!code) return;
        setStatus('validating');

        try {
            // 1. Verify Code exists and is active
            const { data: promo, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code)
                .single();

            if (error || !promo) {
                setStatus('error');
                setMessage('Este código não é válido.');
                return;
            }

            if (!promo.is_active) {
                setStatus('error');
                setMessage('Este código expirou ou está inativo.');
                return;
            }

            // 2. Check usage limit (Optional for now, but good practice)
            // For MVP we skip detailed user_usage check unless required.

            setStatus('success');
            setMessage(`Código aplicado! Desconto de ${promo.type === 'PERCENT' ? promo.value + '%' : promo.value + ' MT'}.`);

            // 3. Set in Store and Navigate back
            setTimeout(() => {
                setActivePromo(promo);
                navigate(-1);
            }, 1500);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Erro ao verificar código.');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-bold text-black">Promoções</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 px-6 pt-6">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket size={32} className="text-[#3ae012]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#101b0d] mb-2">Tem um código?</h2>
                    <p className="text-gray-500 text-sm">
                        Insira o código promocional para ganhar descontos nas suas viagens.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setStatus('idle');
                            }}
                            placeholder="Inserir código"
                            className="w-full h-14 bg-gray-50 border border-transparent focus:border-[#3ae012] focus:bg-white rounded-2xl px-4 font-bold text-center text-lg uppercase outline-none transition-all tracking-widest"
                        />
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-1">
                            <AlertCircle size={16} />
                            {message}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-1">
                            <CheckCircle2 size={16} />
                            {message}
                        </div>
                    )}

                    <Button
                        className="w-full h-14 rounded-2xl bg-[#101b0d] text-white hover:bg-black font-bold shadow-lg shadow-black/10 mt-4"
                        onClick={handleApply}
                        disabled={!code || status === 'validating' || status === 'success'}
                    >
                        {status === 'validating' ? 'A verificar...' : 'Aplicar Código'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
