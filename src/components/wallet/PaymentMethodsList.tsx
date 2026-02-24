import { Wallet, Banknote, Smartphone, CreditCard, Trash2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface PaymentMethod {
    id: string;
    type: string;
    number: string;
    expiry: string;
}

interface PaymentMethodsListProps {
    savedCards: PaymentMethod[];
    defaultMethod: string;
    balance: number;
    onSelectDefault: (method: string) => void;
    onDeleteCard: (id: string) => void;
    onAddCard: () => void;
}

export const PaymentMethodsList = ({
    savedCards,
    defaultMethod,
    balance,
    onSelectDefault,
    onDeleteCard,
    onAddCard
}: PaymentMethodsListProps) => {
    return (
        <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Métodos de Pagamento</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">

                {/* LiftCard (Wallet) - ALWAYS TOP */}
                <div
                    onClick={() => onSelectDefault('WALLET')}
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

                {/* Cash */}
                <div
                    onClick={() => onSelectDefault('CASH')}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'CASH' ? 'bg-[#3ae012]/10 text-[#3ae012]' : 'bg-gray-50 text-gray-400'}`}>
                        <Banknote size={20} />
                    </div>
                    <div className="flex-1">
                        <p className={`font-bold ${defaultMethod === 'CASH' ? 'text-black' : 'text-gray-900'}`}>Dinheiro</p>
                        <p className="text-xs text-gray-400">Pagar diretamente ao motorista</p>
                    </div>
                    {defaultMethod === 'CASH' && (
                        <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                    )}
                </div>

                {/* M-Pesa */}
                <div
                    onClick={() => onSelectDefault('MPESA')}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer relative"
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${defaultMethod === 'MPESA' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                        <Smartphone size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">M-Pesa</p>
                        <p className="text-xs text-gray-400">Pagar via telemóvel</p>
                    </div>
                    {defaultMethod === 'MPESA' && (
                        <div className="w-4 h-4 rounded-full border-[3px] border-[#3ae012]"></div>
                    )}
                </div>

                {/* Saved Cards */}
                {savedCards.map((card) => {
                    const isSelected = defaultMethod === `CARD:${card.id}`;
                    return (
                        <div
                            key={card.id}
                            onClick={() => onSelectDefault(`CARD:${card.id}`)}
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
                                    onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
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
                onClick={onAddCard}
            >
                <Plus size={18} className="mr-2" /> Adicionar Novo Cartão
            </Button>
        </div>
    );
};
