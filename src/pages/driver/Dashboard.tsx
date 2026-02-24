import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../../stores/useTripStore';
import type { TripDetails } from '../../types/trip';
import { useDriverStore } from '../../stores/useDriverStore';
import { Button } from '../../components/ui/button';
import { Power, User, BarChart2, Home, Bot } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase } from '../../lib/supabase';
import { ChatDrawer } from '../../components/ui/chat-drawer';
import { AIAssistantDrawer } from '../../components/ui/ai-assistant-drawer';
import Map from '../../components/map/Map';
import { DriverRequestCard } from '../../components/driver/DriverRequestCard';
import { DriverNavigationMode } from '../../components/driver/DriverNavigationMode';
import GamificationWidget from './components/GamificationWidget';

export default function DriverDashboard() {
    // 1. Stores
    const {
        status,
        tripDetails,
        userId,
        rehydrateActiveTrip,
        arriveAtPickup,
        startTrip,
        completeTrip,
        cancelTrip
    } = useTripStore();

    const navigate = useNavigate();

    const {
        isOnline,
        incomingRequests,
        setOnlineStatus,
        updateLocation,
        addRequest,
        ignoreRequest,
        acceptTrip,
        metrics,
        walletBalance,
        fetchBalance,
        fetchMetrics,
        fetchFleetInfo
    } = useDriverStore();

    // 2. Local State
    const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'profile'>('home');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    // 3. Geolocation & Updates
    const { latitude, longitude } = useGeolocation(isOnline);
    const lastUpdateRef = useRef<number>(0);

    // --- EFFECT: Init & Rehydration ---
    useEffect(() => {
        const init = async () => {
            useTripStore.getState().setUserRole('DRIVER');
            await rehydrateActiveTrip();

            // Fetch Real Data
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                fetchBalance(user.id);
                fetchMetrics();
                fetchFleetInfo(user.id);
            }
        };
        init();
    }, []);

    // --- EFFECT: Location Sync ---
    useEffect(() => {
        const update = async () => {
            if (!isOnline || !latitude || !longitude) return;
            const now = Date.now();
            if (now - lastUpdateRef.current < 10000) return; // Throttle 10s

            await updateLocation(latitude, longitude);
            lastUpdateRef.current = now;
        };
        update();
    }, [latitude, longitude, isOnline]);

    // --- EFFECT: Simulate Incoming Requests (Realtime) ---
    useEffect(() => {
        if (!isOnline) return;

        const channel = supabase
            .channel('driver-requests')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trips', filter: `status=eq.REQUESTING` },
                (payload: { new: any }) => {
                    const req = payload.new;
                    if (!req) return;
                    addRequest({
                        id: req.id,
                        origin: req.origin_address,
                        destination: req.destination_address,
                        price: req.price,
                        distance: req.distance_km + ' km',
                        duration: req.duration_min + ' min',
                        passenger: {
                            first_name: 'Passageiro',
                            avatar_url: null
                        },
                        ...req
                    });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isOnline]);


    // --- HANDLERS ---
    const handleAction = async (action: string) => {
        if (!tripDetails) return;

        switch (action) {
            case 'arrive': await arriveAtPickup(tripDetails.id); break;
            case 'start': await startTrip(tripDetails.id); break;
            case 'complete': await completeTrip(tripDetails.id); break;
            case 'cancel': await cancelTrip(tripDetails.id, 'driver_cancelled'); break;
            case 'call': window.open('tel:+258840000000'); break;
            case 'chat': setIsChatOpen(true); break;
            case 'notify_arrival': alert('Notificação enviada!'); break;
        }
    };

    const handleNavigate = () => {
        if (!tripDetails) return;
        const target = status === 'ACCEPTED' ? tripDetails.origin : tripDetails.destination;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`, '_blank');
    };

    // --- RENDER HELPERS ---
    const renderHomeContent = () => {
        if (!isOnline) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm px-6">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-gray-100 max-w-sm w-full">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Power size={32} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#101b0d] mb-2">Você está Offline</h2>
                        <p className="text-gray-500 font-medium mb-8">Fique online para começar a faturar.</p>
                        <Button
                            className="w-full h-14 bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800"
                            onClick={() => setOnlineStatus(true)}
                        >
                            FICAR ONLINE
                        </Button>
                    </div>
                </div>
            );
        }

        // Active Trip Mode
        if (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(status) && tripDetails) {
            return (
                <DriverNavigationMode
                    trip={tripDetails}
                    status={status as any}
                    onAction={handleAction}
                    onNavigate={handleNavigate}
                />
            );
        }

        // Request Mode (Overlay)
        if (status === 'IDLE' && incomingRequests.length > 0) {
            const req = incomingRequests[0];
            const cardTrip: TripDetails = {
                ...req,
                serviceId: req.serviceId || 'drive',
                status: 'REQUESTING' as any,
                tripDetails: null
            } as any;

            return (
                <DriverRequestCard
                    trip={cardTrip}
                    onAccept={() => userId && acceptTrip(req.id, userId)}
                    onReject={() => ignoreRequest(req.id)}
                />
            );
        }

        // Idle Radar Mode
        return (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-bold text-sm text-[#101b0d]">Procurando passageiros...</span>
            </div>
        );
    };


    return (
        <div className="min-h-dvh bg-gray-50 flex flex-col relative overflow-hidden">

            {/* --- MAP LAYER --- */}
            <div className="absolute inset-0 z-0">
                <Map
                    driverLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                    pickupLocation={tripDetails ? { lat: tripDetails.originLat!, lng: tripDetails.originLng! } : null}
                    destinationLocation={tripDetails ? { lat: tripDetails.destLat!, lng: tripDetails.destLng! } : null}
                    tripStatus={status}
                />
            </div>

            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-40 px-6 pb-4 pt-safe flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                    <User size={16} />
                    <span className="font-bold text-xs text-[#101b0d]">{activeTab === 'home' ? 'Motorista' : activeTab}</span>
                    {activeTab === 'home' && isOnline && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                </div>

                {isOnline && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="pointer-events-auto bg-white/90 shadow-sm w-10 h-10 rounded-full p-0 text-red-500"
                        onClick={() => setOnlineStatus(false)}
                    >
                        <Power size={18} />
                    </Button>
                )}
            </header>

            {/* --- MAIN ORCHESTRATOR --- */}
            <main className="flex-1 relative z-10 pointer-events-none">
                <div className="pointer-events-auto h-full">
                    {activeTab === 'home' && renderHomeContent()}

                    {activeTab === 'earnings' && (
                        <div className="h-full bg-white animate-in slide-in-from-bottom pt-20 px-6">
                            <h2 className="text-2xl font-black mb-4">Ganhos</h2>
                            <div className="bg-gray-900 text-white p-6 rounded-3xl mb-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Saldo na Carteira</p>
                                <h3 className="text-3xl font-black mb-4">{walletBalance.toLocaleString()} MT</h3>
                                <Button
                                    className="bg-primary text-black font-bold h-10 px-6 rounded-full hover:bg-green-600 transition-colors"
                                    onClick={() => navigate('/passenger/wallet')}
                                >
                                    IR PARA CARTEIRA
                                </Button>
                            </div>
                            <GamificationWidget totalTrips={metrics?.tripsToday || 0} rating={metrics?.rating || 5.0} />
                        </div>
                    )}
                </div>
            </main>

            {/* --- TAB BAR --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-2 pb-safe flex justify-between items-center z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-black' : 'text-gray-400'}`}>
                    <Home size={24} className={activeTab === 'home' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-0.5">Início</span>
                </button>
                <button onClick={() => setActiveTab('earnings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'earnings' ? 'text-black' : 'text-gray-400'}`}>
                    <BarChart2 size={24} className={activeTab === 'earnings' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-0.5">Ganhos</span>
                </button>
                <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'profile' ? 'text-black' : 'text-gray-400'}`}>
                    <User size={24} className={activeTab === 'profile' ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold mt-0.5">Perfil</span>
                </button>
            </nav>

            {/* --- DRAWERS --- */}
            <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} receiverName="Passageiro" />
            <AIAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} userRole="driver" />

            {/* AI Button */}
            <div className={`fixed bottom-24 right-4 z-[900] pointer-events-auto transition-transform ${activeTab !== 'home' ? 'translate-y-20' : ''}`}>
                <Button className="w-12 h-12 rounded-full bg-black text-white shadow-xl flex items-center justify-center p-0" onClick={() => setIsAiOpen(true)}>
                    <Bot size={24} />
                </Button>
            </div>

        </div>
    );
}
