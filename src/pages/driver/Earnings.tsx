import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, TrendingUp, Info, Wallet, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { initiateMpesaPayment } from '../../lib/mpesa';
import { initiateEmolaPayment } from '../../lib/emola';
import { processCardPayment } from '../../lib/credit_card';

export default function DriverEarnings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        tripsToday: 0
    });
    const [walletBalance, setWalletBalance] = useState(0);
    const [recentTrips, setRecentTrips] = useState<any[]>([]);

    // Top Up Modal State
    const [showTopUp, setShowTopUp] = useState(false);
    const [provider, setProvider] = useState<'MPESA' | 'EMOLA' | 'CARD'>('MPESA');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardHolder, setCardHolder] = useState('');

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleTopUp = async () => {
        if (!topUpAmount) return;
        if (provider !== 'CARD' && !phoneNumber) return;
        if (provider === 'CARD' && (!cardNumber || !cardExpiry || !cardCvc)) return;

        setProcessing(true);

        try {
            const amount = parseFloat(topUpAmount);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("No user");

            let transactionId = 'MANUAL_' + Date.now();

            if (provider === 'MPESA') {
                // Call Real/Test M-Pesa Service
                const response = await initiateMpesaPayment(
                    phoneNumber.replace(/\D/g, '').startsWith('258') ? phoneNumber.replace(/\D/g, '') : `258${phoneNumber.replace(/\D/g, '')}`,
                    amount,
                    user.id
                );
                console.log('[Earnings] M-Pesa Response:', response);
                transactionId = response.transactionId;
            } else if (provider === 'EMOLA') {
                // Call Real/Test eMola Service
                const response = await initiateEmolaPayment(
                    phoneNumber.replace(/\D/g, '').startsWith('258') ? phoneNumber.replace(/\D/g, '') : `258${phoneNumber.replace(/\D/g, '')}`,
                    amount,
                    user.id
                );
                console.log('[Earnings] eMola Response:', response);
                transactionId = response.transactionId;
            } else if (provider === 'CARD') {
                // Call Real/Test Card Service
                const response = await processCardPayment({
                    cardNumber,
                    expiry: cardExpiry,
                    cvc: cardCvc,
                    holderName: cardHolder
                }, amount);
                console.log('[Earnings] Card Response:', response);
                transactionId = response.transactionId;
            }

            // 1. Update Wallet Balance
            const { error: walletError } = await supabase.rpc('increment_balance', {
                user_id: user.id,
                amount: amount
            });

            // If RPC doesn't exist (likely), we try direct update (less secure but works for MVP)
            if (walletError) {
                // Fallback: Get current balance + amount
                const { data: current } = await supabase.from('driver_wallets').select('balance').eq('driver_id', user.id).single();
                const newBalance = (current?.balance || 0) + amount;

                await supabase.from('driver_wallets').update({ balance: newBalance }).eq('driver_id', user.id);
            }

            // 2. Record Transaction
            await supabase.from('transactions').insert({
                driver_id: user.id,
                amount: amount,
                type: 'TOPUP',
                description: `Carregamento ${provider === 'MPESA' ? 'M-Pesa' : provider === 'EMOLA' ? 'eMola' : 'Cartão'} (${provider === 'CARD' ? `Final ${cardNumber.slice(-4)}` : phoneNumber}) Ref: ${transactionId}`
            });

            setSuccess(true);
            setWalletBalance(prev => prev + amount); // Optimistic update

        } catch (err) {
            console.error(err);
            alert("Erro ao processar pagamento.");
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

            // 1. Fetch Wallet Balance (Mocked for now if table doesn't exist yet)
            const { data: wallet } = await supabase
                .from('driver_wallets')
                .select('balance')
                .eq('driver_id', user.id)
                .single();

            if (wallet) {
                setWalletBalance(wallet.balance);
            } else {
                // Default mock for demo if table missing
                setWalletBalance(-450.00);
            }

            // 2. Fetch Trips for Stats
            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', user.id)
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false });

            if (trips) {
                let todaySum = 0;
                let weekSum = 0;
                let todayCount = 0;

                trips.forEach((t: any) => {
                    const price = parseFloat(t.price?.toString().replace('$', '') || '0');
                    const tDate = t.created_at;

                    if (tDate >= startOfDay) {
                        todaySum += price;
                        todayCount++;
                    }
                    // Simplified week logic
                    weekSum += price;
                });

                setStats({
                    today: todaySum,
                    week: weekSum,
                    tripsToday: todayCount
                });

                setRecentTrips(trips.slice(0, 10));
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const isNegative = walletBalance < 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 pt-safe shadow-sm flex items-center gap-4 sticky top-0 z-10 transition-shadow">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Ganhos & Carteira</h1>
            </header>

            <main className="flex-1 p-4 pb-safe space-y-6">

                {/* 1. Wallet Balance Card (The "Virtual Account") */}
                <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ${isNegative ? 'bg-red-600' : 'bg-[#101b0d]'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-white/80 font-medium text-sm uppercase tracking-wider">Saldo da Carteira</span>
                            <Info size={14} className="text-white/50" />
                        </div>
                        <div className="text-4xl font-black mb-6 flex items-baseline gap-1">
                            {walletBalance.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <span className="text-lg font-medium opacity-70">MT</span>
                        </div>

                        {isNegative ? (
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 flex items-start gap-3">
                                <AlertTriangle size={24} className="text-yellow-300 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm text-yellow-100">Atenção: Saldo Negativo</p>
                                    <p className="text-xs text-white/90 leading-relaxed mt-1">
                                        As comissões de viagens em dinheiro foram descontadas. Por favor, carregue a sua conta para evitar bloqueios.
                                    </p>
                                    <Button
                                        size="sm"
                                        className="mt-2 bg-white text-red-600 hover:bg-white/90 font-bold border-0"
                                        onClick={() => {
                                            setTopUpAmount(Math.abs(walletBalance).toString());
                                            setShowTopUp(true);
                                        }}
                                    >
                                        Pagar Dívida
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-[#3ae012] text-black hover:bg-[#32c910] font-bold border-0"
                                    onClick={() => {
                                        setTopUpAmount('');
                                        setShowTopUp(true);
                                    }}
                                >
                                    Adicionar Fundos
                                </Button>
                                <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white font-bold">
                                    Levantar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Earnings Stats (Cash mainly) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Ganho Hoje</div>
                        <div className="text-2xl font-black text-gray-900">{stats.today.toLocaleString()} MT</div>
                        <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                            <TrendingUp size={12} /> {stats.tripsToday} viagens
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Esta Semana</div>
                        <div className="text-2xl font-black text-gray-900">{stats.week.toLocaleString()} MT</div>
                    </div>
                </div>

                {/* 3. Transaction History (Simulating Commission Deductions) */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 px-1 text-lg">Extrato Recente</h3>
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-[#3ae012] border-t-transparent rounded-full" /></div>
                    ) : (
                        <div className="space-y-4">
                            {recentTrips.map(trip => {
                                const price = parseFloat(trip.price?.toString().replace('$', '') || '0');
                                const commission = price * 0.20; // 20% commission simulation

                                return (
                                    <div key={trip.id} className="relative pl-4">
                                        {/* Connecting Line */}
                                        <div className="absolute left-1.5 top-8 bottom-0 w-0.5 bg-gray-100 last:bg-transparent" />

                                        {/* Trip Entry (Income) */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                <div className="w-3 h-3 bg-[#3ae012] rounded-full mt-1.5 shadow-sm ring-4 ring-white relative z-10" />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Viagem Concluída (Dinheiro)</p>
                                                    <p className="text-xs text-gray-400">{new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ID: {trip.id.slice(0, 6)}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-900">+{price.toLocaleString()} MT</span>
                                        </div>

                                        {/* Commission Entry (Expense) */}
                                        <div className="flex justify-between items-start mb-6 pl-6 opacity-70">
                                            <div className="flex gap-3">
                                                <div className="w-2 h-2 bg-red-400 rounded-full mt-2" />
                                                <div>
                                                    <p className="font-medium text-gray-600 text-xs">Taxa de Serviço eLift (20%)</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-red-500 text-xs">-{commission.toLocaleString()} MT</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* TOP UP MODAL (M-PESA / EMOLA) */}
            {showTopUp && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">

                        {!success ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Carregar Carteira</h2>
                                    <Button variant="ghost" size="icon" onClick={() => setShowTopUp(false)}>
                                        <ArrowLeft className="rotate-[-90deg]" />
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    {/* Provider Selector */}
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <button
                                            onClick={() => setProvider('MPESA')}
                                            className={`h-14 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center text-[10px] sm:text-xs ${provider === 'MPESA' ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            M-Pesa
                                        </button>
                                        <button
                                            onClick={() => setProvider('EMOLA')}
                                            className={`h-14 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center text-[10px] sm:text-xs ${provider === 'EMOLA' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            eMola
                                        </button>
                                        <button
                                            onClick={() => setProvider('CARD')}
                                            className={`h-14 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center text-[10px] sm:text-xs ${provider === 'CARD' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            Gwova / Visa
                                        </button>
                                    </div>

                                    {/* Selected Logo */}
                                    <div className="flex justify-center mb-4">
                                        {provider === 'MPESA' && (
                                            <div className="h-12 w-auto bg-red-600 text-white font-bold px-4 flex items-center rounded-lg shadow-sm">
                                                Vodacom M-Pesa
                                            </div>
                                        )}
                                        {provider === 'EMOLA' && (
                                            <div className="h-12 w-auto bg-orange-500 text-white font-bold px-4 flex items-center rounded-lg shadow-sm">
                                                Movitel eMola
                                            </div>
                                        )}
                                        {provider === 'CARD' && (
                                            <div className="h-12 w-auto bg-blue-600 text-white font-bold px-4 flex items-center rounded-lg shadow-sm">
                                                Pagamento Online
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Valor a Pagar (MT)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">MT</span>
                                            <input
                                                type="number"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                                className="w-full bg-gray-50 h-14 pl-12 pr-4 rounded-xl font-bold text-xl border-2 border-transparent focus:border-[#3ae012] outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {provider === 'CARD' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Titular do Cartão</label>
                                                <input
                                                    type="text"
                                                    value={cardHolder}
                                                    onChange={(e) => setCardHolder(e.target.value)}
                                                    className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    placeholder="Nome como no cartão"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Número do Cartão</label>
                                                <input
                                                    type="text"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                                    className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                    placeholder="0000 0000 0000 0000"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Validade</label>
                                                    <input
                                                        type="text"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                        placeholder="MM/AA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">CVC</label>
                                                    <input
                                                        type="text"
                                                        value={cardCvc}
                                                        onChange={(e) => setCardCvc(e.target.value.slice(0, 3))}
                                                        className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                                        placeholder="123"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Número de Telefone</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">+258</span>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="w-full bg-gray-50 h-14 pl-16 pr-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-[#3ae012] outline-none transition-all"
                                                    placeholder="84/85 xxx xxxx"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
                                        <span className="font-bold block mb-1">Como funciona:</span>
                                        Irá receber um pop-up do {provider === 'MPESA' ? 'M-Pesa' : 'eMola'} no seu telemóvel. Insira o seu PIN para confirmar a transação. O saldo será atualizado automaticamente.
                                    </div>

                                    <Button
                                        className="w-full h-14 bg-[#3ae012] hover:bg-[#32c910] text-[#0a1208] text-lg font-bold rounded-xl shadow-lg shadow-green-500/20"
                                        onClick={handleTopUp}
                                        disabled={processing || !topUpAmount || !phoneNumber}
                                    >
                                        {processing ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                Processando...
                                            </div>
                                        ) : (
                                            provider === 'CARD' ? 'Pagar com Cartão' : `Pagar com ${provider === 'MPESA' ? 'M-Pesa' : 'eMola'}`
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                    <TrendingUp size={40} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Pagamento Recebido!</h2>
                                <p className="text-gray-500 mb-8">A sua carteira foi carregada com sucesso e a sua conta está ativa.</p>
                                <Button
                                    className="w-full h-14 bg-black text-white font-bold rounded-xl"
                                    onClick={() => {
                                        setShowTopUp(false);
                                        setSuccess(false);
                                        // Simple refresh to show new state
                                        window.location.reload();
                                    }}
                                >
                                    Concluído
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
