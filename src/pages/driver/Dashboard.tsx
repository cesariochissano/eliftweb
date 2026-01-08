import { useState, useEffect, useRef } from 'react';
import { useTripStore } from '../../stores/useTripStore';
import { useDriverStore } from '../../stores/useDriverStore';
import { Button } from '../../components/ui/button';
import { MapPin, Navigation, DollarSign, User, Clock, Power, LogOut, MessageSquare, TrendingUp, ChevronRight, Calendar, Bot, Bell, AlertTriangle, Shield, Zap, Share2 } from 'lucide-react';
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
    const { status, tripDetails, startTrip, completeTrip, resetTrip, cancelTrip, setUserRole, logout, isSyncing, isActionLoading, isSimulatingArrival, setSimulatingArrival, userId, messages, isWaitingActive, setAtStop, stopArrivalTime } = useTripStore();

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

    // OFFLINE VIEW
    if (!isOnline) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Power size={32} className="text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Você está Offline</h1>
                <p className="text-gray-400 mb-8 max-w-xs">Fique online para começar a receber solicitações de viagem nas proximidades.</p>
                <Button
                    size="lg"
                    className="w-full bg-primary text-black hover:bg-primary-dark font-bold"
                    onClick={() => handleToggleOnline(true)}
                >
                    FICAR ONLINE
                </Button>
            </div>
        );
    }

    const isBlocked = walletBalance < -1500;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Syncing Indicator */}
            {isSyncing && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full z-[5000] flex items-center gap-3 shadow-2xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold tracking-wide text-primary uppercase">Sincronizando...</span>
                </div>
            )}

            {/* Header */}
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
                            onClick={() => navigate('/driver/earnings')}
                        >
                            Regularizar
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full text-red-500 hover:bg-red-50"
                        onClick={() => logout()}
                    >
                        <LogOut size={20} />
                    </Button>
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => navigate('/driver/profile')}>
                        <User size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">Motorista</h2>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            ONLINE
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleToggleOnline(false)}>
                    <Power size={20} className="text-red-500" />
                </Button>
            </header>

            <div className="fixed top-20 right-4 z-[900]">
                <Button
                    className="w-12 h-12 rounded-full bg-black text-primary shadow-xl border-2 border-primary/20 flex items-center justify-center p-0"
                    onClick={() => setIsAiOpen(true)}
                >
                    <Bot size={24} />
                </Button>
            </div>

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

            {/* Map - Background when on trip */}
            {(status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') && (
                <div className="absolute inset-0 z-0">
                    <Map
                        driverLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                        pickupLocation={tripDetails ? { lat: tripDetails.originLat!, lng: tripDetails.originLng! } : null}
                        destinationLocation={tripDetails ? { lat: tripDetails.destLat!, lng: tripDetails.destLng! } : null}
                        onMapClick={(lat, lng) => console.log('Map clicked:', lat, lng)}
                        tripStatus={status}
                        isSimulatingArrival={isSimulatingArrival}
                    />
                </div>
            )}

            <main className={`flex-1 p-4 flex flex-col gap-4 relative z-10 ${status !== 'IDLE' ? 'pt-64' : 'pt-24'}`}>
                {/* --- REQUESTS FEED --- */}
                {status === 'IDLE' && incomingRequests.length > 0 && (
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Bell size={16} className="text-primary animate-bounce" />
                            <h3 className="font-bold text-sm text-gray-700">Novos Pedidos ({incomingRequests.length})</h3>
                        </div>
                        {incomingRequests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl p-4 shadow-lg border border-primary/20 animate-in slide-in-from-bottom duration-300">
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

                {/* --- IDLE STATE --- */}
                {status === 'IDLE' && incomingRequests.length === 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center py-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Navigation size={32} className="text-blue-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">A procurar passageiros...</h3>
                        <p className="text-xs text-gray-400">Mantenha o app aberto. Os pedidos aparecerão aqui.</p>
                    </div>
                )}

                {/* --- STATISTICS --- */}
                {status === 'IDLE' && (
                    <>
                        {fleetType !== 'CORPORATE' ? (
                            <div className="bg-black text-white rounded-2xl p-5 shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/driver/earnings')}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Ganhos Hoje</span>
                                    <TrendingUp size={16} className="text-primary" />
                                </div>
                                <div className="text-3xl font-bold mb-1">{stats.todayEarnings.toLocaleString()} MZN</div>
                                <div className="text-xs text-gray-400">{stats.todayTrips} viagens concluídas</div>
                            </div>
                        ) : (
                            <div className="bg-primary text-black rounded-2xl p-5 shadow-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-black/60 text-xs font-bold uppercase tracking-wider">Produção Hoje</span>
                                    <TrendingUp size={16} className="text-black" />
                                </div>
                                <div className="text-3xl font-black mb-1">{stats.todayTrips} Viagens</div>
                                <div className="text-xs text-black/60 font-medium">Conta Corporativa • Salário Fixo</div>
                            </div>
                        )}

                        <GamificationWidget totalTrips={stats.todayTrips || 0} rating={4.9} />

                        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 flex-1 overflow-y-auto min-h-[200px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar size={18} className="text-primary" />
                                    Histórico Recente
                                </h3>
                                {fleetType !== 'CORPORATE' && (
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Carteira</div>
                                        <div className="text-sm font-bold text-green-600">{walletBalance.toFixed(2)} MT</div>
                                    </div>
                                )}
                            </div>
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
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className="text-[10px] font-bold text-primary truncate">{trip.origin_address}</span>
                                                </div>
                                                <div className="text-xs font-bold text-gray-700 truncate">{trip.destination_address}</div>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                {fleetType !== 'CORPORATE' && (
                                                    <div className="text-sm font-bold text-gray-900">{parseFloat(trip.price?.toString() || '0')} MT</div>
                                                )}
                                                <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* --- TRIP IN PROGRESS --- */}
                {(status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') && tripDetails && (
                    <div className="bg-white rounded-2xl p-5 shadow-soft border-2 border-primary/20 flex-1 flex flex-col animate-in zoom-in-95 duration-300">
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
                                <div className="text-[10px] font-bold text-primary uppercase">
                                    {tripDetails.serviceId === 'drive' ? 'LiftDrive' :
                                        tripDetails.serviceId === 'bike' ? 'LiftBike' :
                                            tripDetails.serviceId === 'txopela' ? 'LiftTxopela' : 'LiftCarga'}
                                </div>
                                <div className="text-[10px] text-gray-400">Dinheiro</div>
                            </div>
                        </div>

                        {/* Stops List (Bloco 7.4) */}
                        {tripDetails.stops && tripDetails.stops.length > 0 && (
                            <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Paragens Adicionais</p>
                                <div className="space-y-2">
                                    {tripDetails.stops.map((stop, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                                            <span className="truncate">{stop.address}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Navigation size={18} className="text-blue-500" />
                                <span className="font-bold text-lg">
                                    {isSimulatingArrival ? 'Confirmando chegada...' :
                                        status === 'ACCEPTED' ? 'A caminho do Passageiro' :
                                            status === 'ARRIVED' ?
                                                (isWaitingActive ? 'Aguardando (Taxiando)' : 'Aguardando Passageiro') :
                                                (stopArrivalTime ? 'Paragem (Espera Ativa)' : 'A caminho do Destino')}
                                </span>
                                {(isWaitingActive || stopArrivalTime) && (
                                    <span className="ml-auto bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-black animate-pulse">
                                        +{tripDetails.waitingTimeMin}min
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 mb-6 pl-7">
                                {status === 'ACCEPTED' || status === 'ARRIVED' ? tripDetails.origin : tripDetails.destination}
                            </p>
                        </div>

                        <div className="mt-auto">
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

                            {/* SOS & Partilhar (Bloco 7.4) */}
                            <div className="flex gap-2 mb-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10 rounded-xl border-red-100 text-red-600 bg-red-50 font-bold text-xs"
                                    onClick={() => {/* SOS Logic */ }}
                                >
                                    <Zap size={14} className="mr-2 fill-current" /> SOS
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10 rounded-xl border-blue-100 text-blue-600 bg-blue-50 font-bold text-xs"
                                    onClick={() => {/* Share Logic */ }}
                                >
                                    <Share2 size={14} className="mr-2" /> Partilhar
                                </Button>
                            </div>

                            {status === 'ACCEPTED' && !isSimulatingArrival && (
                                <Button
                                    size="lg"
                                    className="w-full h-14 bg-black hover:bg-gray-900 text-white font-bold border-none shadow-lg"
                                    onClick={() => {
                                        if (tripDetails?.id && latitude && longitude) {
                                            const speedKmh = (speed || 0) * 3.6;
                                            const validation = EliftIntelligence.validateArrivedStatus(latitude, longitude, tripDetails.originLat!, tripDetails.originLng!, speedKmh);
                                            if (!validation.valid) {
                                                alert(validation.reason);
                                                return;
                                            }
                                            useTripStore.getState().arriveAtPickup(tripDetails.id);
                                            setSimulatingArrival(true);
                                        }
                                    }}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <MapPin className="mr-2" size={20} />
                                            Cheguei ao Local
                                        </>
                                    )}
                                </Button>
                            )}

                            {status === 'ARRIVED' && !isSimulatingArrival && (
                                <Button
                                    size="lg"
                                    className="w-full h-14"
                                    onClick={handleStartWithPin}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? (
                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Clock className="mr-2" size={20} />
                                            Iniciar Viagem {tripDetails?.securityPin ? '(PIN)' : ''}
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* PIN MODAL (Bloco 7.4) */}
                            {showPinModal && (
                                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Shield size={32} className="text-gray-900" />
                                            </div>
                                            <h2 className="text-xl font-bold">PIN de Segurança</h2>
                                            <p className="text-gray-500 text-sm">Peça ao passageiro o código de 4 dígitos para iniciar.</p>
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
                                            <Button variant="ghost" className="h-12 font-bold" onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(null); }}>
                                                Cancelar
                                            </Button>
                                            <Button className="h-12 bg-primary text-black font-bold rounded-xl" onClick={confirmPin} disabled={pinInput.length < 4}>
                                                Confirmar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status === 'IN_PROGRESS' && tripDetails.stops && tripDetails.stops.length > 0 && !stopArrivalTime && (
                                <Button
                                    size="lg"
                                    onClick={() => setAtStop(tripDetails.id)}
                                    className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-bold border-none shadow-md mb-4"
                                >
                                    <Clock className="mr-2" size={20} />
                                    Cheguei à Paragem
                                </Button>
                            )}

                            {stopArrivalTime && (
                                <Button
                                    size="lg"
                                    onClick={() => useTripStore.setState({ stopArrivalTime: null })}
                                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold border-none shadow-md mb-4"
                                >
                                    <Navigation className="mr-2" size={20} />
                                    Continuar Viagem
                                </Button>
                            )}

                            {status === 'IN_PROGRESS' && (
                                <Button
                                    size="lg"
                                    className="w-full h-14 bg-green-600 text-white hover:bg-green-700 border-none font-bold"
                                    onClick={() => tripDetails?.id && completeTrip(tripDetails.id)}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <DollarSign className="mr-2" size={20} />
                                            Finalizar e Receber
                                        </>
                                    )}
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button variant="ghost" className="text-red-500 text-xs" onClick={() => tripDetails?.id && cancelTrip(tripDetails.id, 'DRIVER_CANCELLED')}>
                                    Cancelar (Outro)
                                </Button>
                                <Button variant="ghost" className="text-red-500 text-xs" onClick={() => tripDetails?.id && cancelTrip(tripDetails.id, 'PASSENGER_NO_SHOW')}>
                                    Cancelar (No Show)
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
