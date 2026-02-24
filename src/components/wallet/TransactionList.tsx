import { ArrowDownLeft, ArrowUpRight, Car, Smartphone } from 'lucide-react';
import type { Transaction } from '../../types/wallet';
import { format, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';

interface TransactionListProps {
    transactions: Transaction[];
    isLoading?: boolean;
}

export const TransactionList = ({ transactions, isLoading = false }: TransactionListProps) => {

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 mt-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-3 w-16 bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="h-4 w-12 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <ArrowDownLeft size={32} />
                </div>
                <h3 className="text-gray-900 font-bold mb-1">Sem movimentos</h3>
                <p className="text-gray-500 text-sm">O seu histórico aparecerá aqui.</p>
            </div>
        );
    }

    // Group by Date helper could be here, but for MVP plain list is fine.
    // Let's do simple visual grouping logic in mapping if needed, or just list.

    const getIcon = (type: string) => {
        switch (type) {
            case 'TRIP_PAYMENT': return <Car size={20} className="text-gray-700" />;
            case 'TOPUP': return <Smartphone size={20} className="text-[#10D772]" />; // M-Pesa Green
            case 'COMMISSION_DEDUCTION': return <ArrowUpRight size={20} className="text-red-500" />;
            default: return <ArrowDownLeft size={20} className="text-gray-500" />;
        }
    };

    const formatAmount = (amount: number) => {
        const isPositive = amount > 0;
        const colorClass = isPositive ? 'text-[#16a34a]' : 'text-gray-900';
        const sign = isPositive ? '+' : '';
        return <span className={`font-bold ${colorClass}`}>{sign}{amount.toLocaleString('pt-MZ')} MT</span>;
    };

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Histórico</h3>

            <div className="flex flex-col gap-3">
                {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
                                {getIcon(tx.type)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-900 line-clamp-1">
                                    {tx.description || (tx.type === 'TOPUP' ? 'Carregamento' : 'Viagem')}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {isToday(new Date(tx.created_at))
                                        ? `Hoje, ${format(new Date(tx.created_at), 'HH:mm')}`
                                        : format(new Date(tx.created_at), 'd MMM, HH:mm', { locale: pt })
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            {formatAmount(tx.amount)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
