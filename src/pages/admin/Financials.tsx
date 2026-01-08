import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    TrendingUp, PieChart, Activity,
    Download, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminFinancials() {
    const [stats, setStats] = useState({
        totalGross: 0,
        totalPlatformProfit: 0,
        totalPayouts: 0,
        pendingBalance: 0
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Total Gross from Trips
            const { data: trips } = await supabase
                .from('trips')
                .select('price')
                .eq('status', 'COMPLETED');

            const totalGross = trips?.reduce((acc: number, trip: any) => acc + (trip.price || 0), 0) || 0;

            // 2. Fetch Platform Profit (DEBIT transactions to drivers that are commissions)
            const { data: debits } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'DEBIT');

            // Commission is stored as negative in transactions (as a debit to driver)
            // Profit for eLift is the absolute sum of these commissions.
            const totalPlatformProfit = Math.abs(debits?.reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0) || 0);

            // 3. Recent Transactions
            const { data: recentTx } = await supabase
                .from('transactions')
                .select(`
                    *,
                    driver:driver_id (
                        profiles:id (first_name, last_name)
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            setStats({
                totalGross,
                totalPlatformProfit,
                totalPayouts: totalGross - totalPlatformProfit,
                pendingBalance: 0 // Logic for pending withdrawals
            });
            setTransactions(recentTx || []);

        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Financeiro Global</h1>
                    <p className="text-sm font-medium text-gray-400">Visão em tempo real de transações e fluxos de caixa.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-xs font-black uppercase tracking-wider rounded-xl border-gray-200">
                        <Calendar size={14} /> Últimos 30 dias
                    </Button>
                    <Button variant="outline" size="icon" className="text-gray-400 rounded-xl border-gray-200">
                        <Download size={18} />
                    </Button>
                </div>
            </header>

            <div className="w-full space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Volume Total (Gross)</div>
                        <div className="text-2xl font-black text-gray-900">{stats.totalGross.toLocaleString()} MT</div>
                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold mt-2">
                            <ArrowUpRight size={14} /> +12% vs last month
                        </div>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-lg shadow-gray-200">
                        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Lucro eLift (Comissões)</div>
                        <div className="text-2xl font-black text-[#3ae012]">{stats.totalPlatformProfit.toLocaleString()} MT</div>
                        <div className="flex items-center gap-1 text-[#3ae012]/60 text-xs font-bold mt-2">
                            <TrendingUp size={14} /> Margem saudável
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pagamentos (Motorista/Frota)</div>
                        <div className="text-2xl font-black text-gray-900">{stats.totalPayouts.toLocaleString()} MT</div>
                        <div className="text-gray-400 text-xs font-bold mt-2">88.5% do volume total</div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Balanço Pendente</div>
                        <div className="text-2xl font-black text-blue-600">0 MT</div>
                        <div className="text-gray-400 text-xs font-bold mt-2">Pronto para saque</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Activity className="text-primary" size={20} /> Transações Recentes
                        </h2>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                            ) : (
                                <table className="w-full text-left font-sans">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entidade</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 text-xs text-gray-500 font-medium">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-bold text-gray-900">
                                                        {tx.driver?.profiles?.first_name} {tx.driver?.profiles?.last_name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{tx.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className={`p-4 text-right font-black text-sm ${tx.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} MT
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Financial Health / Alerts */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <PieChart className="text-primary" size={20} /> Saúde Financeira
                        </h2>

                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-gray-500 uppercase">Payouts Processados</span>
                                    <span className="text-gray-900">92%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: '92%' }} />
                                </div>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                <div className="flex gap-3">
                                    <ArrowDownRight className="text-orange-600 shrink-0" size={20} />
                                    <div>
                                        <div className="text-xs font-bold text-orange-900 uppercase">Atenção Necessária</div>
                                        <p className="text-[11px] text-orange-700 mt-1">
                                            3 motoristas detectados com saldo negativo superior a 1500 MT. Risco de inadimplência.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full bg-[#3ae012] hover:bg-[#32c910] text-gray-900 font-black uppercase tracking-wider text-xs h-12 rounded-2xl">
                                Conciliar Todas as Taxas
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
