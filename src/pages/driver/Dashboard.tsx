import { useState, useEffect, useRef } from 'react';
import { useTripStore } from '../../stores/useTripStore';
import { useDriverStore } from '../../stores/useDriverStore';
import { Button } from '../../components/ui/button';
import { MapPin, Navigation, DollarSign, User, Clock, Power, LogOut, MessageSquare, TrendingUp, ChevronRight, Calendar, Bot, Bell, AlertTriangle, Shield, Home, BarChart2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase } from '../../lib/supabase';
import { ChatDrawer } from '../../components/ui/chat-drawer';
import { AIAssistantDrawer } from '../../components/ui/ai-assistant-drawer';
import GamificationWidget from './components/GamificationWidget';
import Map from '../../components/map/Map';
import { EliftIntelligence } from '../../lib/elift-intelligence';
import { Input } from '../../components/ui/input';

export default function DriverDashboard() {
    // Legacy store for Active Trip management (Start/Complete)
    const { status, tripDetails, startTrip, completeTrip, resetTrip, setUserRole, logout, isSyncing, isActionLoading, isSimulatingArrival, setSimulatingArrival, userId, messages, isWaitingActive, stopArrivalTime } = useTripStore();

    // New Store for Driver State & Requests
    const { isOnline, incomingRequests, toggleOnline, acceptTrip, ignoreRequest, walletBalance, fetchBalance, fleetType, fetchFleetInfo } = useDriverStore();

    const navigate = useNavigate();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const { latitude, longitude, speed } = useGeolocation(isOnline);
    const lastUpdateRef = useRef<number>(0);
    const [stats, setStats] = useState({ todayEarnings: 0, todayTrips: 0 });
    const [recentTrips, setRecentTrips] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const prevMessagesLen = useRef(0);

    // Navigation State
    const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'profile'>('home');

    // Bloco 7.4: PIN State
    const [pinInput, setPinInput] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinError, setPinError] = useState<string | null>(null);

    const handleStartWithPin = () => {
        if (!tripDetails?.id) return;
        if (tripDetails.securityPin) {
            setShowPinModal(true);
        } else {
            startTrip(tripDetails.id);
        }
    };

    const confirmPin = async () => {
        if (pinInput === tripDetails?.securityPin) {
            startTrip(tripDetails!.id);
            setShowPinModal(false);
            setPinInput('');
            setPinError(null);
        } else {
            setPinError('PIN de segurança incorreto.');
        }
    };

    // Track unread messages
    useEffect(() => {
        if (!isChatOpen && messages.length > prevMessagesLen.current) {
            setUnreadCount(prev => prev + (messages.length - prevMessagesLen.current));
        }
        if (isChatOpen) {
            setUnreadCount(0);
        }
        prevMessagesLen.current = messages.length;
    }, [messages.length, isChatOpen]);

    // Set Driver Role & Get ID on mount
    useEffect(() => {
        setUserRole('DRIVER');
    }, [setUserRole]);

    // Handle Arrival Simulation
    useEffect(() => {
        if (status === 'ARRIVED') {
            setSimulatingArrival(true);
            const timer = setTimeout(() => {
                setSimulatingArrival(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status, setSimulatingArrival]);

    // Force Home Tab on Active Trip
    useEffect(() => {
        if (status !== 'IDLE') {
            setActiveTab('home');
        }
    }, [status]);

    // Update Driver Location in DB
    useEffect(() => {
        const updateLocation = async () => {
            if (!isOnline || !latitude || !longitude) return;

            // Throttle updates to every 10 seconds
            const now = Date.now();
            if (now - lastUpdateRef.current < 10000) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('drivers').upsert({
                        id: user.id,
                        lat: latitude,
                        lng: longitude,
                        is_online: true,
                        last_seen: new Date().toISOString()
                    });
                    lastUpdateRef.current = now;
                }
            } catch (err) {
                console.error('Error updating location:', err);
            }
        };

        updateLocation();
    }, [latitude, longitude, isOnline]);

    // Handle Online Toggle
    const handleToggleOnline = async (status: boolean) => {
        if (status === true && walletBalance < -1500) {
            alert(`A sua conta está bloqueada. O seu saldo é de ${walletBalance} MT. Por favor, regularize a dívida (Limite: -1500 MT) para voltar a trabalhar.`);
            return;
        }
        await toggleOnline(status);
    };

    // Auto-reset check (Legacy)
    useEffect(() => {
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            const timer = setTimeout(() => resetTrip(), 5000);
            return () => clearTimeout(timer);
        }
    }, [status, resetTrip]);

    // Fetch Stats and History
    useEffect(() => {
        const fetchDriverData = async () => {
            if (!userId) return;

            // Today's stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: trips } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', userId)
                .eq('status', 'COMPLETED')
                .gte('created_at', today.toISOString());

            if (trips) {
                const total = trips.reduce((acc: number, t: any) => acc + (parseFloat(t.price?.toString() || '0')), 0);
                setStats({ todayEarnings: total, todayTrips: trips.length });
            }

            // Recent History (Last 10)
            const { data: history } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', userId)
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false })
                .limit(10);

            if (history) setRecentTrips(history);
        };

        if (isOnline || status === 'IDLE') {
            fetchDriverData();
            if (userId) {
                fetchBalance(userId);
                fetchFleetInfo(userId);
            }
        }
    }, [isOnline, status, userId, fetchBalance, fetchFleetInfo]);

    const handleNavigation = () => {
        if (!tripDetails) return;
        const target = status === 'ACCEPTED' ? tripDetails.origin : tripDetails.destination;
        const encoded = encodeURIComponent(target);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    };

    // OFFLINE LAYOUT INTEGRATION
    // Instead of returning early, we now render the main layout but with specific visual cues for Offline state.

    const isBlocked = walletBalance < -1500;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            {/* Syncing Indicator */}
            {isSyncing && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full z-[5000] flex items-center gap-3 shadow-2xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold tracking-wide text-primary uppercase">Sincronizando...</span>
                </div>
            )}

            {/* Header (Depends on Tab) */}
            <header className="fixed top-0 left-0 right-0 bg-white z-20 px-6 py-4 pt-safe flex items-center justify-between shadow-sm transition-all duration-300">
                {isBlocked && (
                    <div className="absolute top-[100%] left-0 right-0 bg-red-600 text-white p-2 text-xs font-bold text-center animate-in slide-in-from-top flex items-center justify-center gap-4 shadow-md">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} />
                            <span>Bloqueado: {walletBalance} MT</span>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-white text-white hover:bg-white hover:text-red-600 px-3 bg-red-500/50"
                            onClick={() => setActiveTab('earnings')}
                        >
                            Regularizar
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setActiveTab('profile')}>
                        <User size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">
                            {activeTab === 'home' ? 'Motorista' : activeTab === 'earnings' ? 'Ganhos & Finanças' : 'Perfil'}
                        </h2>
                        {activeTab === 'home' && (
                            <div className={`flex items-center gap-1 text-xs font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'home' && isOnline && (
                    <Button variant="ghost" size="sm" onClick={() => handleToggleOnline(false)}>
                        <Power size={20} className="text-red-500" />
                    </Button>
                )}
            </header>

            <ChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                receiverName="Passageiro"
            />

            <AIAssistantDrawer
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                userRole="driver"
                contextData={{
                    stats,
                    status,
                    tripDetails,
                    isOnline
                }}
            />

            {/* --- MAP (BACKGROUND) --- */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${activeTab !== 'home' ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${!isOnline ? 'grayscale opacity-50' : ''}`}>
                <Map
                    driverLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                    pickupLocation={tripDetails ? { lat: tripDetails.originLat!, lng: tripDetails.originLng! } : null}
                    destinationLocation={tripDetails ? { lat: tripDetails.destLat!, lng: tripDetails.destLng! } : null}
                    onMapClick={(lat, lng) => console.log('Map clicked:', lat, lng)}
                    tripStatus={status}
                    isSimulatingArrival={isSimulatingArrival}
                />
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col relative z-10 pt-20 pb-20 overflow-hidden">

                {/* TAB: EARNINGS */}
                {activeTab === 'earnings' && (
                    <div className="flex-1 overflow-y-auto px-4 pb- safe space-y-4 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 h-full">
                        {fleetType !== 'CORPORATE' ? (
                            <div className="bg-black text-white rounded-2xl p-6 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Carteira Digital</span>
                                    <DollarSign size={20} className="text-primary" />
                                </div>
                                <div className="text-4xl font-bold mb-2">{walletBalance.toFixed(2)} MZN</div>
                                <div className="text-sm text-gray-400">Saldo disponível para levantamento</div>
                            </div>
                        ) : (
                            <div className="bg-primary text-black rounded-2xl p-6 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-black/60 text-sm font-bold uppercase tracking-wider">Produção Hoje</span>
                                    <TrendingUp size={20} className="text-black" />
                                </div>
                                <div className="text-4xl font-black mb-2">{stats.todayTrips} Viagens</div>
                                <div className="text-sm text-black/60 font-medium">Conta Corporativa • Salário Fixo</div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Ganhos Hoje</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.todayEarnings.toLocaleString()} MT</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Viagens Hoje</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.todayTrips}</p>
                            </div>
                        </div>

                        <GamificationWidget totalTrips={stats.todayTrips || 0} rating={4.9} />

                        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-primary" />
                                Histórico Recente
                            </h3>
                            <div className="space-y-4">
                                {recentTrips.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-xs">Nenhuma viagem recente encontrada.</div>
                                ) : (
                                    recentTrips.map((trip: any) => (
                                        <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary truncate">{trip.origin_address}</span>
                                                </div>
                                                <div className="text-xs font-bold text-gray-700 truncate">{trip.destination_address}</div>
                                            </div>
                                            <div className="text-right font-bold text-sm">
                                                {parseFloat(trip.price?.toString() || '0')} MT
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: PROFILE */}
                {activeTab === 'profile' && (
                    <div className="flex-1 overflow-y-auto px-4 pb-safe space-y-4 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 h-full">
                        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg">
                                {/* Placeholder */}
                                <User className="w-full h-full p-4 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold">Motorista</h2>
                            <p className="text-gray-500 text-sm">Toyota Ractis • ABH 123 MP</p>
                            <div className="mt-4 flex gap-4">
                                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                                    <p className="font-black text-lg">4.9</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Avaliação</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                                    <p className="font-black text-lg">1.2k</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Viagens</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button className="w-full bg-white p-4 rounded-xl shadow-sm text-left font-bold flex items-center justify-between hover:bg-gray-50">
                                <span className="flex items-center gap-3"><Settings size={20} className="text-gray-400" /> Configurações</span>
                                <ChevronRight size={16} className="text-gray-300" />
                            </button>
                            <button onClick={() => navigate('/driver/documents')} className="w-full bg-white p-4 rounded-xl shadow-sm text-left font-bold flex items-center justify-between hover:bg-gray-50">
                                <span className="flex items-center gap-3"><Shield size={20} className="text-gray-400" /> Documentos</span>
                                <ChevronRight size={16} className="text-gray-300" />
                            </button>
                            <button onClick={() => logout()} className="w-full bg-red-50 p-4 rounded-xl shadow-sm text-left font-bold flex items-center justify-between text-red-600 hover:bg-red-100">
                                <span className="flex items-center gap-3"><LogOut size={20} className="text-red-500" /> Sair da Conta</span>
                            </button>
                        </div>
                    </div>
                )}


                {/* TAB: HOME (Requests & Status) */}
                {activeTab === 'home' && (
                    <div className="flex-1 flex flex-col px-4 pt-4 pointer-events-none">
                        {/* Feed Container */}
                        <div className="pointer-events-auto">

                            {/* --- OFFLINE STATE (NEW) --- */}
                            {!isOnline && (
                                <div className="fixed bottom-24 left-4 right-4 animate-in slide-in-from-bottom duration-500 bg-white rounded-2xl p-6 shadow-xl border border-gray-100 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Power size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">Você está Offline</h3>
                                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Fique online para começar a receber solicitações de viagem nas proximidades.</p>
                                    <Button
                                        size="lg"
                                        className="w-full bg-primary text-white hover:bg-green-600 font-bold h-14 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                                        onClick={() => handleToggleOnline(true)}
                                    >
                                        FICAR ONLINE
                                    </Button>
                                </div>
                            )}

                            {/* --- REQUESTS FEED --- */}
                            {isOnline && status === 'IDLE' && incomingRequests.length > 0 && (
                                <div className="mb-4 space-y-3 pb-24 overflow-y-auto max-h-[70vh]">
                                    <div className="flex items-center gap-2 mb-2 px-1 bg-white/80 backdrop-blur-sm self-start inline-flex rounded-full py-1 pr-3 shadow-sm border border-white/50">
                                        <Bell size={16} className="text-primary animate-bounce ml-2" />
                                        <h3 className="font-bold text-sm text-gray-900">Novos Pedidos ({incomingRequests.length})</h3>
                                    </div>
                                    {incomingRequests.map((req) => (
                                        <div key={req.id} className="bg-white rounded-2xl p-4 shadow-xl border border-primary/20 animate-in slide-in-from-bottom duration-300">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                                        {req.passenger.avatar_url ? (
                                                            <img src={req.passenger.avatar_url} alt="User" />
                                                        ) : (
                                                            <User size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{req.passenger.first_name}</div>
                                                        <div className="text-xs text-gray-400">4.8 ⭐</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="text-xl font-black">{req.price} MT</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{req.distance}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={16} className="text-green-600" />
                                                    <span className="text-sm font-medium truncate">{req.origin_address}</span>
                                                </div>
                                                <div className="w-0.5 h-3 bg-gray-200 ml-2" />
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={16} className="text-red-500" />
                                                    <span className="text-sm font-medium truncate">{req.destination_address}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="outline" size="sm" className="font-bold border-gray-200" onClick={() => ignoreRequest(req.id)}>
                                                    Ignorar
                                                </Button>
                                                <Button size="sm" className="bg-primary text-black hover:bg-primary-dark font-bold" onClick={() => userId && acceptTrip(req.id, userId)}>
                                                    Aceitar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* --- IDLE STATE (Empty) --- */}
                            {isOnline && status === 'IDLE' && incomingRequests.length === 0 && (
                                <div className="fixed bottom-24 left-4 right-4 animate-in slide-in-from-bottom duration-500">
                                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 text-center relative overflow-hidden">
                                        <div className="w-60 h-60 bg-green-400/20 rounded-full absolute -top-10 -right-10 blur-3xl animate-pulse" />
                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center animate-bounce">
                                                <Navigation size={24} className="text-blue-500" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <h3 className="font-bold text-gray-900">A procurar passageiros...</h3>
                                                <p className="text-xs text-gray-500">Mantenha-se online.</p>
                                            </div>
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TRIP IN PROGRESS --- */}
                            {isOnline && (status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') && tripDetails && (
                                <div className="fixed bottom-24 left-4 right-4 z-[900] animate-in slide-in-from-bottom duration-300">
                                    <div className="bg-white rounded-3xl p-5 shadow-2xl border-2 border-primary/20 flex flex-col">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold">Passageiro</div>
                                                    <div className="text-xs text-gray-500">⭐ 4.9</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">
                                                    {((tripDetails.price || 0) + (tripDetails.waitingTimeCost || 0) + (tripDetails.routeAdjustmentCost || 0)).toLocaleString()} MZN
                                                </div>
                                                <div className="text-[10px] text-gray-400">Dinheiro</div>
                                            </div>
                                        </div>

                                        {/* Simplified Status Header */}
                                        <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
                                            <Navigation size={18} className="text-blue-500" />
                                            <span className="font-bold text-base truncate flex-1">
                                                {isSimulatingArrival ? 'Confirmando chegada...' :
                                                    status === 'ACCEPTED' ? tripDetails.origin :
                                                        status === 'ARRIVED' ? 'Aguardando embarque...' :
                                                            tripDetails.destination}
                                            </span>
                                            {(isWaitingActive || stopArrivalTime) && (
                                                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-black animate-pulse">
                                                    +{tripDetails.waitingTimeMin}min
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <Button variant="outline" className="h-12 border-primary text-primary font-bold gap-2" onClick={handleNavigation}>
                                                <Navigation size={18} /> Navegar
                                            </Button>
                                            <Button variant="outline" className="h-12 border-gray-200 font-bold gap-2 relative" onClick={() => setIsChatOpen(true)}>
                                                <MessageSquare size={18} /> Chat
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Action Buttons */}
                                        {status === 'ACCEPTED' && !isSimulatingArrival && (
                                            <Button size="lg" className="w-full h-14 bg-black hover:bg-gray-900 text-white font-bold border-none shadow-lg"
                                                onClick={() => {
                                                    if (tripDetails?.id && latitude && longitude) {
                                                        const speedKmh = (speed || 0) * 3.6;
                                                        const validation = EliftIntelligence.validateArrivedStatus(latitude, longitude, tripDetails.originLat!, tripDetails.originLng!, speedKmh);
                                                        if (!validation.valid) { alert(validation.reason); return; }
                                                        useTripStore.getState().arriveAtPickup(tripDetails.id);
                                                        setSimulatingArrival(true);
                                                    }
                                                }} disabled={isActionLoading}>
                                                {isActionLoading ? <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin" /> : <><MapPin className="mr-2" size={20} /> Cheguei ao Local</>}
                                            </Button>
                                        )}

                                        {status === 'ARRIVED' && !isSimulatingArrival && (
                                            <Button size="lg" className="w-full h-14" onClick={handleStartWithPin} disabled={isActionLoading}>
                                                {isActionLoading ? <div className="w-5 h-5 border-2 border-primary/30 rounded-full animate-spin" /> : <><Clock className="mr-2" size={20} /> Iniciar Viagem {tripDetails?.securityPin ? '(PIN)' : ''}</>}
                                            </Button>
                                        )}

                                        {status === 'IN_PROGRESS' && (
                                            <Button size="lg" className="w-full h-14 bg-green-600 text-white hover:bg-green-700 border-none font-bold" onClick={() => tripDetails?.id && completeTrip(tripDetails.id)} disabled={isActionLoading}>
                                                {isActionLoading ? <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin" /> : <><DollarSign className="mr-2" size={20} /> Finalizar e Receber</>}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* --- BOTTOM NAVIGATION BAR (FIXED) --- */}
            {/* Hide if there's an active trip to focus driver? Or keep it? The user chose "Option A" so we keep it. */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 pt-2 pb-safe flex justify-between items-center z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-gray-900 bg-gray-50 w-20' : 'text-gray-400'}`}
                >
                    <Home size={24} className={activeTab === 'home' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold">Início</span>
                </button>
                <button
                    onClick={() => setActiveTab('earnings')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'earnings' ? 'text-gray-900 bg-gray-50 w-20' : 'text-gray-400'}`}
                >
                    <BarChart2 size={24} className={activeTab === 'earnings' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold">Ganhos</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'profile' ? 'text-gray-900 bg-gray-50 w-20' : 'text-gray-400'}`}
                >
                    <User size={24} className={activeTab === 'profile' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold">Perfil</span>
                </button>
            </nav>

            {/* AI Floating Button (Adjusted Position) */}
            <div className={`fixed bottom-24 right-4 z-[900] transition-transform ${activeTab !== 'home' ? 'translate-y-20' : ''}`}>
                <Button
                    className="w-12 h-12 rounded-full bg-black text-primary shadow-xl border-2 border-primary/20 flex items-center justify-center p-0"
                    onClick={() => setIsAiOpen(true)}
                >
                    <Bot size={24} />
                </Button>
            </div>

            {/* PIN MODAL */}
            {showPinModal && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">PIN de Segurança</h2>
                            <p className="text-gray-500 text-sm">Peça o código ao passageiro.</p>
                        </div>
                        <Input
                            type="tel"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            className="text-center text-4xl font-black h-20 tracking-[12px] bg-gray-50 border-gray-100 rounded-2xl mb-4"
                            placeholder="----"
                            autoFocus
                        />
                        {pinError && <p className="text-red-500 text-xs text-center font-bold mb-4">{pinError}</p>}
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="ghost" className="h-12 font-bold" onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(null); }}>Cancelar</Button>
                            <Button className="h-12 bg-primary text-black font-bold rounded-xl" onClick={confirmPin} disabled={pinInput.length < 4}>Confirmar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
