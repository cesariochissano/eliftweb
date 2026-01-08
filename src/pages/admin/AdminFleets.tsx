import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Truck, Activity,
    ShieldCheck, AlertTriangle, Search, Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminFleets() {
    const [fleets, setFleets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFleets();
    }, []);

    const fetchFleets = async () => {
        setLoading(true);
        // Fetch fleets with counts of drivers and vehicles (simulated via multiple queries or sophisticated select)
        const { data, error } = await supabase
            .from('fleets')
            .select('*');

        if (!error && data) {
            // Enrich with counts (simple approach for MVP)
            const enriched = await Promise.all(data.map(async (fleet: any) => {
                const { count: drivers } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('fleet_id', fleet.id);
                const { count: vehicles } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('fleet_id', fleet.id);
                return { ...fleet, driversCount: drivers || 0, vehiclesCount: vehicles || 0 };
            }));
            setFleets(enriched);
        }
        setLoading(false);
    };

    const toggleStatus = async (fleetId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const { error } = await supabase
            .from('fleets')
            .update({ status: newStatus })
            .eq('id', fleetId);

        if (!error) {
            setFleets(fleets.map(f => f.id === fleetId ? { ...f, status: newStatus } : f));
        } else {
            alert('Erro ao atualizar status: ' + error.message);
        }
    };

    const filteredFleets = fleets.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.legal_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Gestão Global de Frotas</h1>
                    <p className="text-sm font-medium text-gray-400">Controlo de frotas corporativas e individuais.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Procurar frota..."
                            className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon"><Filter size={18} /></Button>
                </div>
            </header>

            <div className="w-full">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-center">Tipo</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Frota / Empresa</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-center">Veículos</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-center">Motoristas</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredFleets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-gray-400">Nenhuma frota encontrada.</td>
                                        </tr>
                                    ) : filteredFleets.map((fleet) => (
                                        <tr key={fleet.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 text-center">
                                                {fleet.type === 'CORPORATE' ? (
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto" title="Corporativa">
                                                        <Activity size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mx-auto" title="Individual">
                                                        <Truck size={16} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{fleet.name}</div>
                                                <div className="text-xs text-gray-400 font-medium">{fleet.legal_name || 'Individual'}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-gray-700">{fleet.vehiclesCount}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-gray-700">{fleet.driversCount}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${fleet.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {fleet.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="text-xs font-bold text-gray-500 hover:text-primary">
                                                        Ver Detalhes
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`text-[10px] font-black uppercase tracking-wider h-8 ${fleet.status === 'SUSPENDED' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'
                                                            }`}
                                                        onClick={() => toggleStatus(fleet.id, fleet.status || 'ACTIVE')}
                                                    >
                                                        {fleet.status === 'SUSPENDED' ? 'Reativar' : 'Suspender'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Truck size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-primary/80 uppercase tracking-wider">Total Frotas</div>
                            <div className="text-2xl font-black text-primary">{fleets.length}</div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">Corporativas</div>
                            <div className="text-2xl font-black text-blue-600">{fleets.filter(f => f.type === 'CORPORATE').length}</div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-amber-500 uppercase tracking-wider">Inativas</div>
                            <div className="text-2xl font-black text-amber-600">0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
