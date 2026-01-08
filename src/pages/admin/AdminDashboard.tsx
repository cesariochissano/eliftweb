import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Car, CreditCard, Activity, FileText, CheckCircle, MessageSquare, Truck } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDrivers: 0,
        totalTrips: 0,
        totalRevenue: 0
    });
    const [pendingDocs, setPendingDocs] = useState(0);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // Mock stats or real count queries
        // Real counts would be:
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: drivers } = await supabase.from('drivers').select('*', { count: 'exact', head: true });
        const { count: trips } = await supabase.from('trips').select('*', { count: 'exact', head: true });

        // Pending Docs
        const { count: pending } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('document_status', 'PENDING');

        // Platform Profit (Commissions)
        const { data: commissions } = await supabase.from('transactions').select('amount').eq('type', 'DEBIT');
        const platformProfit = Math.abs(commissions?.reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0) || 0);

        setStats({
            totalUsers: users || 0,
            totalDrivers: drivers || 0,
            totalTrips: trips || 0,
            totalRevenue: platformProfit
        });
        setPendingDocs(pending || 0);
    };

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Pending Tasks Banner */}
            <div
                className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => navigate('/admin/verifications')}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-amber-900">Verificações Pendentes</h2>
                        <p className="text-amber-700">{pendingDocs} motoristas aguardam aprovação</p>
                    </div>
                </div>
                <CheckCircle className="text-amber-600" size={24} />
            </div>

            {/* Stats Grid */}
            <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Visão Geral</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total Usuários" value={stats.totalUsers} color="bg-blue-500" />
                    <StatCard icon={Car} label="Total Motoristas" value={stats.totalDrivers} color="bg-indigo-500" />
                    <StatCard icon={Activity} label="Viagens Realizadas" value={stats.totalTrips} color="bg-green-500" />
                    <div onClick={() => navigate('/admin/financials')} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
                        <StatCard icon={CreditCard} label="Receita Plataforma" value={`${stats.totalRevenue.toLocaleString()} MT`} color="bg-gray-900" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Gestão</h2>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 grid grid-cols-1 md:grid-cols-2">
                    <div
                        onClick={() => navigate('/admin/tickets')}
                        className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors border-r border-gray-50"
                    >
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Suporte</h3>
                            <p className="text-gray-500 text-sm">Gerir tickets e reclamações</p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/admin/fleets')}
                        className="p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Gerir Frotas</h3>
                            <p className="text-gray-500 text-sm">Controle global de frotistas</p>
                        </div>
                    </div>

                    <button className="p-6 flex items-center justify-between hover:bg-gray-50 text-left">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Configurações</h3>
                            <p className="text-gray-500 text-sm">Plataforma e taxas</p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Em breve</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
