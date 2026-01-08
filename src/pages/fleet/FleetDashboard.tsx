import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Truck, DollarSign, Map as MapIcon, LogOut, Wrench, Link as LinkIcon, Home, Menu, X, BarChart3, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import StatCard from './components/StatCard';
import DriversTable from './components/DriversTable';
import VehiclesTable from './components/VehiclesTable';
import Map from '../../components/map/Map';
import MaintenancePanel from './components/MaintenancePanel';
import AssignmentsPanel from './components/AssignmentsPanel';
import GaragesPanel from './components/GaragesPanel';
import DocumentsReviewPanel from './components/DocumentsReviewPanel';
import FinancialsPanel from './components/FinancialsPanel';

export default function FleetDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        earnings: '0,00',
        activeDrivers: 0,
        totalTrips: 0,
        totalDistance: 0,
        averageRating: 0
    });

    const [view, setView] = useState<'overview' | 'drivers' | 'vehicles' | 'map' | 'maintenance' | 'assignments' | 'garages' | 'documents' | 'financials'>('overview');
    const [onlineDrivers, setOnlineDrivers] = useState<Array<{ id: string, lat: number, lng: number }>>([]);
    const [fleet, setFleet] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchFleet = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('fleets').select('*').eq('owner_id', user.id).single();
                setFleet(data);
            }
        }
        fetchFleet();
    }, []);

    useEffect(() => {
        if (!fleet?.id) return;

        const fetchStats = async () => {
            // 1. Active Drivers (In this fleet)
            const { count: activeCount } = await supabase
                .from('drivers')
                .select('*', { count: 'exact', head: true })
                .eq('fleet_id', fleet.id)
                .eq('is_online', true);

            // 2. Today's Trips & Earnings
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { data: trips } = await supabase
                .from('trips')
                .select('price, rating') // Assume price/amount is what we sum for individual
                .eq('fleet_id', fleet.id)
                .eq('status', 'COMPLETED')
                .gte('created_at', startOfDay.toISOString());

            const { count: totalTripsCount } = await supabase
                .from('trips')
                .select('*', { count: 'exact', head: true })
                .eq('fleet_id', fleet.id)
                .eq('status', 'COMPLETED');

            const totalEarnings = trips?.reduce((acc: number, curr: any) => acc + (curr.price || 0), 0) || 0;
            const avgRating = trips && trips.length > 0
                ? trips.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / trips.length
                : 4.8; // Fallback

            setStats(prev => ({
                ...prev,
                activeDrivers: activeCount || 0,
                totalTrips: totalTripsCount || 0,
                earnings: totalEarnings.toLocaleString('pt-MZ', { minimumFractionDigits: 2 }),
                averageRating: avgRating
            }));
        };

        fetchStats();

        const channel = supabase.channel(`fleet-stats-${fleet.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'drivers',
                filter: `fleet_id=eq.${fleet.id}`
            }, () => fetchStats())
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'trips',
                filter: `fleet_id=eq.${fleet.id}`
            }, () => fetchStats())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fleet?.id]);

    // Fetch All Online Drivers for Map
    useEffect(() => {
        if (view !== 'map' || !fleet?.id) return;

        const fetchOnlineDrivers = async () => {
            const { data } = await supabase
                .from('drivers')
                .select('id, lat, lng')
                .eq('fleet_id', fleet.id)
                .eq('is_online', true);

            if (data) setOnlineDrivers(data);
        };

        fetchOnlineDrivers();
        const interval = setInterval(fetchOnlineDrivers, 10000);

        return () => clearInterval(interval);
    }, [view, fleet?.id]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">eLift<span className="text-primary">.fleet</span></h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <Button variant={view === 'overview' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('overview')}>
                        <DollarSign size={20} className="mr-2" /> Visão Geral
                    </Button>
                    <Button variant={view === 'drivers' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('drivers')}>
                        <Users size={20} className="mr-2" /> Motoristas
                    </Button>
                    <Button variant={view === 'vehicles' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('vehicles')}>
                        <Truck size={20} className="mr-2" /> Veículos
                    </Button>
                    <Button variant={view === 'financials' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('financials')}>
                        <DollarSign size={20} className="mr-2" /> Financeiro
                    </Button>
                    <Button variant={view === 'map' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('map')}>
                        <MapIcon size={20} className="mr-2" /> Mapa da Frota
                    </Button>
                    <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operações</div>
                    <Button variant={view === 'maintenance' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('maintenance')}>
                        <Wrench size={20} className="mr-2" /> Manutenção
                    </Button>
                    <Button variant={view === 'assignments' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('assignments')}>
                        <LinkIcon size={20} className="mr-2" /> Atribuições
                    </Button>
                    <Button variant={view === 'garages' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => setView('garages')}>
                        <Home size={20} className="mr-2" /> Garagens
                    </Button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 font-bold" onClick={handleLogout}>
                        <LogOut size={18} className="mr-2" /> Sair
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar (Slide-in menu) */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 flex justify-between items-center border-b">
                        <h1 className="text-xl font-bold">eLift<span className="text-primary">.fleet</span></h1>
                        <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></Button>
                    </div>
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        <Button variant={view === 'overview' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('overview'); setIsMobileMenuOpen(false); }}>
                            <DollarSign size={20} className="mr-2" /> Visão Geral
                        </Button>
                        <Button variant={view === 'drivers' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('drivers'); setIsMobileMenuOpen(false); }}>
                            <Users size={20} className="mr-2" /> Motoristas
                        </Button>
                        <Button variant={view === 'vehicles' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('vehicles'); setIsMobileMenuOpen(false); }}>
                            <Truck size={20} className="mr-2" /> Veículos
                        </Button>
                        <Button variant={view === 'financials' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('financials'); setIsMobileMenuOpen(false); }}>
                            <DollarSign size={20} className="mr-2" /> Financeiro
                        </Button>
                        <Button variant={view === 'map' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('map'); setIsMobileMenuOpen(false); }}>
                            <MapIcon size={20} className="mr-2" /> Mapa da Frota
                        </Button>
                        <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operações</div>
                        <Button variant={view === 'maintenance' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('maintenance'); setIsMobileMenuOpen(false); }}>
                            <Wrench size={20} className="mr-2" /> Manutenção
                        </Button>
                        <Button variant={view === 'assignments' ? 'primary' : 'ghost'} className="w-full justify-start font-bold" onClick={() => { setView('assignments'); setIsMobileMenuOpen(false); }}>
                            <LinkIcon size={20} className="mr-2" /> Atribuições
                        </Button>
                    </nav>
                    <div className="p-4 border-t">
                        <Button variant="outline" className="w-full text-red-500 border-red-100 font-bold" onClick={handleLogout}>
                            <LogOut size={18} className="mr-2" /> Sair
                        </Button>
                    </div>
                </aside>
            </div>

            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden fixed top-0 w-full bg-white z-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost" className="p-0" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></Button>
                    <h1 className="font-bold text-xl">eLift<span className="text-primary">.fleet</span></h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {fleet?.name?.[0] || 'F'}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">

                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {view === 'overview' && 'Visão Geral'}
                            {view === 'drivers' && 'Gerir Motoristas'}
                            {view === 'vehicles' && 'Gerir Veículos'}
                            {view === 'map' && 'Monitoramento em Tempo Real'}
                            {view === 'maintenance' && 'Gestão de Manutenção'}
                            {view === 'financials' && 'Relatórios e Gestão Financeira'}
                            {view === 'assignments' && 'Atribuição Motorista x Veículo'}
                            {view === 'garages' && 'Depósitos e Garagens'}
                        </h2>
                    </header>

                    {/* Overview View */}
                    {view === 'overview' && (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard
                                    title={fleet?.type === 'CORPORATE' ? "Produção Total" : "Receita Hoje"}
                                    value={fleet?.type === 'CORPORATE' ? `${stats.totalTrips} Viagens` : `${stats.earnings} MZN`}
                                    icon={fleet?.type === 'CORPORATE' ? BarChart3 : DollarSign}
                                    trend="+12%"
                                    color="text-green-600"
                                    bgColor="bg-green-50"
                                />
                                <StatCard
                                    title="Motoristas Ativos"
                                    value={stats.activeDrivers.toString()}
                                    icon={Users}
                                    color="text-blue-600"
                                    bgColor="bg-blue-50"
                                />
                                <StatCard
                                    title="Disponibilidade"
                                    value="92%"
                                    icon={Truck}
                                    trend="+2%"
                                    color="text-purple-600"
                                    bgColor="bg-purple-50"
                                />
                                <StatCard
                                    title="Rating Médio"
                                    value={stats.averageRating.toFixed(1)}
                                    icon={Star}
                                    trend="4.8"
                                    color="text-yellow-600"
                                    bgColor="bg-yellow-50"
                                />
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <LinkIcon size={64} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Código de Convite</p>
                                        <h3 className="text-2xl font-bold tracking-widest text-primary">
                                            {fleet?.invite_code || '---'}
                                        </h3>
                                    </div>
                                    <div className="mt-4">
                                        {fleet?.invite_code ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs h-8 font-bold"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(fleet.invite_code);
                                                    alert("Código copiado!");
                                                }}
                                            >
                                                Copiar Código
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="w-full text-xs h-8 bg-gray-900 text-white hover:bg-black"
                                                onClick={async () => {
                                                    const code = 'FLEET-' + Math.floor(1000 + Math.random() * 9000);
                                                    const { error } = await supabase.from('fleets').update({ invite_code: code }).eq('id', fleet.id);
                                                    if (!error) setFleet({ ...fleet, invite_code: code });
                                                }}
                                            >
                                                Gerar Código
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Table Preview */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg">Motoristas Ativos Recentemente</h3>
                                    <Button variant="link" onClick={() => setView('drivers')}>Ver todos</Button>
                                </div>
                                <DriversTable limit={5} fleet={fleet} />
                            </div>
                        </div>
                    )}

                    {/* Drivers View */}
                    {view === 'drivers' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <DriversTable fleet={fleet} />
                        </div>
                    )}

                    {/* Vehicles View */}
                    {view === 'vehicles' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <VehiclesTable fleet={fleet} />
                        </div>
                    )}

                    {/* Maintenance View */}
                    {view === 'maintenance' && <MaintenancePanel />}

                    {/* Financials View */}
                    {view === 'financials' && <FinancialsPanel fleet={fleet} />}

                    {/* Assignments View */}
                    {view === 'assignments' && <AssignmentsPanel fleet={fleet} />}

                    {/* Garages View */}
                    {view === 'garages' && <GaragesPanel />}


                    {/* Documents Review View */}
                    {view === 'documents' && <DocumentsReviewPanel />}

                    {/* Map View */}
                    {view === 'map' && (
                        <div className="h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                            <Map otherDrivers={onlineDrivers} />
                            <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold">{onlineDrivers.length} Motoristas Online</span>
                            </div>
                        </div>
                    )}

                    {/* Performance Reports Mock (Visible in overview) */}
                    {view === 'overview' && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Eficiência da Frota</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span>Ocupação de Veículos</span>
                                            <span>75%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-3/4" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span>Meta de Receita Mensal</span>
                                            <span>62%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[62%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Principais Alertas</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                                        <Truck size={16} /> Manutenção requerida: Fleet #104
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold">
                                        <Users size={16} /> 2 motoristas com documentos expirando
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
