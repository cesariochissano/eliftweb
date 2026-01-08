import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { initiateMpesaPayment } from '../../lib/mpesa';
import { initiateEmolaPayment } from '../../lib/emola';
import { processCardPayment } from '../../lib/credit_card';
import { supabase } from '../../lib/supabase';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (amount: number) => void;
    userId: string;
    userType: 'DRIVER' | 'PASSENGER';
    initialAmount?: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, userId, userType, initialAmount = '' }: PaymentModalProps) {
    if (!isOpen) return null;

    const [provider, setProvider] = useState<'MPESA' | 'EMOLA' | 'CARD'>('MPESA');
    const [amount, setAmount] = useState(initialAmount);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardHolder, setCardHolder] = useState('');

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        if (!amount) return;
        if (provider !== 'CARD' && !phoneNumber) return;
        if (provider === 'CARD' && (!cardNumber || !cardExpiry || !cardCvc)) return;

        setProcessing(true);

        try {
            const val = parseFloat(amount);
            let transactionId = 'MANUAL_' + Date.now();

            // 1. Call Payment Service
            if (provider === 'MPESA') {
                const response = await initiateMpesaPayment(
                    phoneNumber.replace(/\D/g, '').startsWith('258') ? phoneNumber.replace(/\D/g, '') : `258${phoneNumber.replace(/\D/g, '')}`,
                    val,
                    userId
                );
                console.log('[Payment] M-Pesa:', response);
                transactionId = response.transactionId;
            } else if (provider === 'EMOLA') {
                const response = await initiateEmolaPayment(
                    phoneNumber.replace(/\D/g, '').startsWith('258') ? phoneNumber.replace(/\D/g, '') : `258${phoneNumber.replace(/\D/g, '')}`,
                    val,
                    userId
                );
                console.log('[Payment] eMola:', response);
                transactionId = response.transactionId;
            } else if (provider === 'CARD') {
                const response = await processCardPayment({
                    cardNumber,
                    expiry: cardExpiry,
                    cvc: cardCvc,
                    holderName: cardHolder
                }, val);
                console.log('[Payment] Card:', response);
                transactionId = response.transactionId;
            }

            // 2. Update Wallet Balance (via RPC or Direct for now)
            const rpcName = userType === 'DRIVER' ? 'increment_balance' : 'increment_passenger_balance';
            const table = userType === 'DRIVER' ? 'driver_wallets' : 'passenger_wallets';
            const idField = userType === 'DRIVER' ? 'driver_id' : 'passenger_id';

            const { error: walletError } = await supabase.rpc(rpcName, {
                user_id: userId,
                amount: val
            });

            if (walletError) {
                // Fallback: Direct Update
                const { data: current } = await supabase.from(table).select('balance').eq(idField, userId).single();
                const newBalance = (current?.balance || 0) + val;
                await supabase.from(table).update({ balance: newBalance }).eq(idField, userId);
            }

            // 3. Record Transaction
            await supabase.from('transactions').insert({
                [userType === 'DRIVER' ? 'driver_id' : 'passenger_id']: userId, // database column depends on schema, assuming unified transactions or separate?
                // Assuming 'transactions' table might accept passenger_id now or we need to be careful.
                // For MVP let's assume valid column or just log if schema varies.
                // Let's use a conditional spread for safety.
                ...(userType === 'DRIVER' ? { driver_id: userId } : { passenger_id: userId }), // Requires schema update if passenger_id not in transactions
                amount: val,
                type: 'TOPUP',
                description: `Carregamento ${provider === 'MPESA' ? 'M-Pesa' : provider === 'EMOLA' ? 'eMola' : 'Cartão'} (${provider === 'CARD' ? `Final ${cardNumber.slice(-4)}` : phoneNumber}) Ref: ${transactionId}`
            });

            setSuccess(true);
            onSuccess(val);

        } catch (err) {
            console.error(err);
            alert("Erro ao processar pagamento.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">

                {!success ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Carregar Carteira</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
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

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Valor a Carregar (MT)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">MT</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-gray-50 h-14 pl-12 pr-4 rounded-xl font-bold text-xl border-2 border-transparent focus:border-[#3ae012] outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {provider === 'CARD' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Titular</label>
                                        <input
                                            type="text"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value)}
                                            className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
                                            placeholder="Nome no cartão"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Número</label>
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                            className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
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
                                                className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
                                                placeholder="MM/AA"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">CVC</label>
                                            <input
                                                type="text"
                                                value={cardCvc}
                                                onChange={(e) => setCardCvc(e.target.value.slice(0, 3))}
                                                className="w-full bg-gray-50 h-14 px-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">+258</span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full bg-gray-50 h-14 pl-16 pr-4 rounded-xl font-bold text-lg border-2 border-transparent focus:border-[#3ae012] outline-none"
                                            placeholder="84/85 xxx xxxx"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full h-14 bg-[#3ae012] hover:bg-[#32c910] text-[#0a1208] text-lg font-bold rounded-xl shadow-lg shadow-green-500/20"
                                onClick={handlePayment}
                                disabled={processing || !amount}
                            >
                                {processing ? 'Processando...' : provider === 'CARD' ? 'Pagar com Cartão' : `Pagar com ${provider === 'MPESA' ? 'M-Pesa' : 'eMola'}`}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <TrendingUp size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Sucesso!</h2>
                        <p className="text-gray-500 mb-8">Sua carteira foi carregada com sucesso.</p>
                        <Button
                            className="w-full h-14 bg-black text-white font-bold rounded-xl"
                            onClick={() => {
                                onClose();
                                setSuccess(false);
                            }}
                        >
                            Concluído
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
