import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { DollarSign, TrendingUp, ShieldCheck, User, Settings, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { EliftIntelligence } from '../../../lib/elift-intelligence';

export default function FinancialsPanel({ fleet }: { fleet: any }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalGross: 0,
        platformTake: 0,
        ownerTake: 0,
        driverTake: 0
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [commRate, setCommRate] = useState(fleet?.owner_commission_rate || 10);
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        if (!fleet?.id) return;
        setLoading(true);

        // Fetch Trips to calculate splits
        const { data: trips } = await supabase
            .from('trips')
            .select('*')
            .eq('fleet_id', fleet.id)
            .eq('status', 'COMPLETED');

        if (trips) {
            let gross = 0;
            let platform = 0;
            let owner = 0;
            let driver = 0;

            trips.forEach((t: any) => {
                const tripPrice = t.price || 0;
                gross += tripPrice;

                // Use the intelligence logic to calculate split
                const platformComm = EliftIntelligence.calculateCommission({
                    tripPrice,
                    driverRating: 5, // Mock rating for now
                    tripsToday: 1,
                    isFleetDriver: true,
                    cancelRate: 0
                });

                const split = EliftIntelligence.calculateSplit({
                    tripPrice,
                    platformCommission: platformComm,
                    fleetType: fleet.type,
                    ownerCommissionRate: fleet.owner_commission_rate
                });

                platform += split.platformTake;
                owner += split.fleetTake;
                driver += split.driverTake;
            });

            setStats({
                totalGross: gross,
                platformTake: platform,
                ownerTake: owner,
                driverTake: driver
            });
        }

        // Fetch Recent Transactions
        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('fleet_id', fleet.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txs) setTransactions(txs);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [fleet?.id, fleet?.owner_commission_rate]);

    const handleUpdateRate = async () => {
        setUpdating(true);
        const { error } = await supabase
            .from('fleets')
            .update({ owner_commission_rate: commRate })
            .eq('id', fleet.id);

        if (!error) {
            alert("Taxa de comissão atualizada com sucesso!");
        }
        setUpdating(false);
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold text-lg">Processando dados financeiros...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">TOTAL BRUTO</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stats.totalGross.toLocaleString()} MT</div>
                    <div className="text-xs text-gray-400 mt-1">Volume total gerado</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg text-red-400">PLATAFORMA (18%)</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stats.platformTake.toLocaleString()} MT</div>
                    <div className="text-xs text-gray-400 mt-1">Taxa de serviço eLift</div>
                </div>

                <div className="bg-black p-6 rounded-3xl shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-primary/60 bg-white/5 px-2 py-1 rounded-lg">LUCRO FROTA</span>
                    </div>
                    <div className="text-2xl font-black text-primary">{stats.ownerTake.toLocaleString()} MT</div>
                    <div className="text-xs text-gray-500 mt-1">Seu rendimento líquido</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <User size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">PAGAMENTO CONDUTORES</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stats.driverTake.toLocaleString()} MT</div>
                    <div className="text-xs text-gray-400 mt-1">{fleet.type === 'CORPORATE' ? 'Fixado em $0 (Salário Externo)' : 'Ganhos variáveis atribuídos'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transaction History */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Transações Recentes</h3>
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Ver Todas</Button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {transactions.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">Nenhuma transação encontrada.</div>
                        ) : transactions.map(tx => (
                            <div key={tx.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {tx.type === 'CREDIT' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{tx.description || 'Viagem eLift'}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(tx.created_at).toLocaleString('pt-MZ')}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-black ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}{parseFloat(tx.amount?.toString().replace(/[^0-9.-]+/g, '') || '0').toLocaleString()} MT
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Configuration Area */}
                <div className="space-y-6">
                    {fleet.type === 'INDIVIDUAL' && (
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={18} className="text-primary" />
                                <h3 className="font-bold text-gray-900">Configurar Comissão</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Defina a taxa que sua frota retém sobre cada viagem realizada pelos seus motoristas individuais.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <span className="text-sm font-bold text-gray-700">Taxa da Frota</span>
                                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 focus-within:border-primary transition-colors shadow-sm">
                                        <input
                                            type="number"
                                            value={commRate}
                                            onChange={(e) => setCommRate(Number(e.target.value))}
                                            className="w-12 text-center font-black outline-none bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-gray-400">%</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full font-bold h-12 shadow-lg shadow-primary/10"
                                    onClick={handleUpdateRate}
                                    disabled={updating}
                                >
                                    {updating ? 'Guardando...' : 'Guardar Alterações'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck size={120} />
                        </div>
                        <h3 className="font-bold mb-2 relative z-10">Faturação Automática</h3>
                        <p className="text-xs text-blue-100 leading-relaxed mb-4 relative z-10">
                            Os pagamentos digitais são processados e divididos instantaneamente. As facturas de comissão do eLift são geradas quinzenalmente.
                        </p>
                        <Button variant="outline" className="w-full border-blue-400 text-white hover:bg-blue-500 font-bold bg-blue-500/20 relative z-10">
                            Ver Relatórios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
