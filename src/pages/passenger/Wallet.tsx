import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BalanceCard } from '../../components/wallet/BalanceCard';
import { TransactionList } from '../../components/wallet/TransactionList';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { PaymentMethodsList } from '../../components/wallet/PaymentMethodsList';
import { useWalletStore } from '../../stores/useWalletStore';
import { supabase } from '../../lib/supabase';

const WalletPage = () => {
    const navigate = useNavigate();
    const { wallet, transactions, fetchWallet, isLoading } = useWalletStore();

    // UI State
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Payments Logic State
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [defaultMethod, setDefaultMethod] = useState('WALLET'); // Default to Wallet (Lift Card)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchWallet();
            }

            // Load Saved Payment Data
            const cards = JSON.parse(localStorage.getItem('saved_cards') || '[]');
            setSavedCards(cards);

            const def = localStorage.getItem('default_payment_method') || 'WALLET';
            setDefaultMethod(def);
        };
        init();

        // Optional: Set up realtime subscription here if needed
        // return () => unsubscribe()
    }, [fetchWallet]);

    // Payment Payment Methods Handlers
    const handleSetDefault = (method: string) => {
        setDefaultMethod(method);
        localStorage.setItem('default_payment_method', method);
    };

    const handleDeleteCard = (id: string) => {
        const updated = savedCards.filter(c => c.id !== id);
        setSavedCards(updated);
        localStorage.setItem('saved_cards', JSON.stringify(updated));
        if (defaultMethod === `CARD:${id}`) {
            setDefaultMethod('WALLET');
            localStorage.setItem('default_payment_method', 'WALLET');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative pb-safe-bottom">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 px-4 pt-safe-top pb-4 shadow-sm">
                <div className="flex items-center gap-4 h-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Carteira & Pagamentos</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
                <div className="max-w-md mx-auto space-y-8">

                    {/* Balance Section (Lift Card) */}
                    <div className="relative z-10">
                        <BalanceCard
                            balance={wallet?.balance || 0}
                            isLoading={isLoading && !wallet}
                            onTopUpClick={() => setIsTopUpOpen(true)}
                        />
                    </div>

                    {/* Payment Methods Section (Unified) */}
                    <PaymentMethodsList
                        savedCards={savedCards}
                        defaultMethod={defaultMethod}
                        balance={wallet?.balance || 0}
                        onSelectDefault={handleSetDefault}
                        onDeleteCard={handleDeleteCard}
                        onAddCard={() => navigate('/passenger/payment/add-card')}
                    />

                    {/* Transactions Section */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 min-h-[400px]">
                        <TransactionList
                            transactions={transactions}
                            isLoading={isLoading && transactions.length === 0}
                        />
                    </div>

                </div>
            </div>

            {/* Modals */}
            {userId && (
                <PaymentModal
                    isOpen={isTopUpOpen}
                    onClose={() => setIsTopUpOpen(false)}
                    onSuccess={() => {
                        fetchWallet(); // Refresh balance
                    }}
                    userId={userId}
                    userType="PASSENGER"
                />
            )}
        </div>
    );
};
export default WalletPage;
