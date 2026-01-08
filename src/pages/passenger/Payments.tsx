import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Smartphone, Banknote, CreditCard, Trash2, Wallet } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { PaymentModal } from '../../components/payment/PaymentModal';

export default function Payments() {
    const navigate = useNavigate();
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [balance, setBalance] = useState(0.00);
    const [defaultMethod, setDefaultMethod] = useState('CASH'); // 'CASH', 'MPESA', 'EMOLA', or 'CARD:<id>'

    // Modal State
    const [showTopUp, setShowTopUp] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchWallet(user.id);
            }

            // Load Saved Data
            const cards = JSON.parse(localStorage.getItem('saved_cards') || '[]');
            setSavedCards(cards);

            const def = localStorage.getItem('default_payment_method') || 'CASH';
            setDefaultMethod(def);
        };
        init();
    }, []);

    const fetchWallet = async (uid: string) => {
        const { data } = await supabase.from('passenger_wallets').select('balance').eq('passenger_id', uid).single();
        if (data) setBalance(data.balance);
    };

    const handleDeleteCard = (id: string) => {
        const updated = savedCards.filter(c => c.id !== id);
        setSavedCards(updated);
        localStorage.setItem('saved_cards', JSON.stringify(updated));
        if (defaultMethod === `CARD:${id}`) {
            setDefaultMethod('CASH');
            localStorage.setItem('default_payment_method', 'CASH');
        }
    };

    const handleSetDefault = (method: string) => {
        setDefaultMethod(method);
        localStorage.setItem('default_payment_method', method);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white pt-safe pb-4 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-black" />
                </button>
                <h1 className="text-lg font-bold text-black">Pagamentos</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 px-4 pt-6 space-y-6">

                {/* LIFT CARD / WALLET */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Carteira eLift</h2>
                    <div className="bg-[#101b0d] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-[#3ae012] rounded-full blur-3xl opacity-20"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet size={16} className="text-white/60" />
                                <p className="text-sm font-medium text-white/60">Saldo Atual</p>
                            </div>
                            <h3 className="text-4xl font-extrabold mb-6 tracking-tight flex items-baseline gap-1">
                                {balance.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                                <span className="text-lg font-bold opacity-60">MT</span>
                            </h3>
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-[#3ae012] text-black hover:bg-[#32c910] font-bold rounded-xl h-12 shadow-lg shadow-green-900/20"
                                    onClick={() => setShowTopUp(true)}
                                >
                                    <Plus size={18} className="mr-2" /> Carregar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAYMENT METHODS */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Métodos de Pagamento</h2>
                    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">

                        {/* LiftCard (Wallet) */}
                        <div
                            onClick={() => handleSetDefault('WALLET')}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'WALLET' ? 'bg-[#3ae012]/10 text-[#3ae012]' : 'bg-gray-50 text-gray-400'}`}>
                                <Wallet size={20} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${defaultMethod === 'WALLET' ? 'text-black' : 'text-gray-900'}`}>LiftCard</p>
                                <p className="text-xs text-gray-400">
                                    Saldo: {balance.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                                </p>
                            </div>
                            {defaultMethod === 'WALLET' && (
                                <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                            )}
                        </div>

                        {/* Cash (Default) */}
                        <div
                            onClick={() => handleSetDefault('CASH')}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'CASH' ? 'bg-[#3ae012]/10 text-[#3ae012]' : 'bg-gray-50 text-gray-400'}`}>
                                <Banknote size={20} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${defaultMethod === 'CASH' ? 'text-black' : 'text-gray-900'}`}>Dinheiro</p>
                                <p className="text-xs text-gray-400">Padrão para todas as viagens</p>
                            </div>
                            {defaultMethod === 'CASH' && (
                                <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                            )}
                        </div>

                        {/* M-Pesa */}
                        <div
                            onClick={() => handleSetDefault('MPESA')}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'MPESA' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                <Smartphone size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">M-Pesa</p>
                                <p className="text-xs text-gray-400">Vincular conta</p>
                            </div>
                            {defaultMethod === 'MPESA' && (
                                <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                            )}
                        </div>

                        {/* e-Mola */}
                        <div
                            onClick={() => handleSetDefault('EMOLA')}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'EMOLA' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                                <Smartphone size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">e-Mola</p>
                                <p className="text-xs text-gray-400">Vincular conta</p>
                            </div>
                            {defaultMethod === 'EMOLA' && (
                                <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                            )}
                        </div>

                        {/* Saved Cards */}
                        {savedCards.map((card: any) => {
                            const isSelected = defaultMethod === `CARD:${card.id}`;
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleSetDefault(`CARD:${card.id}`)}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{card.type} •••• {card.number.slice(-4)}</p>
                                        <p className="text-xs text-gray-400">Expira em {card.expiry}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012] absolute right-4"></div>
                                    )}
                                    {!isSelected && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                                            className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all absolute right-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        className="w-full mt-4 h-12 rounded-xl font-bold border-dashed border-2 text-gray-500 hover:text-[#3ae012] hover:border-[#3ae012]"
                        onClick={() => navigate('/passenger/payment/add-card')}
                    >
                        <Plus size={18} className="mr-2" /> Adicionar Novo Cartão
                    </Button>
                </div>
            </div>

            {/* Payment Modal */}
            {userId && (
                <PaymentModal
                    isOpen={showTopUp}
                    onClose={() => setShowTopUp(false)}
                    onSuccess={(amt) => {
                        setBalance(prev => prev + amt);
                        // Optional: show toast
                    }}
                    userId={userId}
                    userType="PASSENGER"
                />
            )}
        </div>
    );
}
