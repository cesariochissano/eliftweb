import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

import Map from '../../components/map/Map';
import { TripRequestForm } from '../../components/home/TripRequestForm';
import { HomeDashboard } from '../../components/home/HomeDashboard';
import { TripActiveView } from '../../components/home/TripActiveView';
import { HomeSkeleton } from '../../components/home/HomeSkeleton';
import { ChatDrawer } from '../../components/ui/chat-drawer';
import { AIAssistantDrawer } from '../../components/ui/ai-assistant-drawer';
import { UnifiedBottomSheet } from '../../components/ui/unified-bottom-sheet';

import { useTripStore } from '../../stores/useTripStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useBackHandler } from '../../hooks/useBackHandler';
import { GeoService } from '../../services/geo.service';
import { supabase } from '../../lib/supabase';

export default function HomePassenger() {
    const navigate = useNavigate();
    const {
        status,
        tripDetails,
        isSyncing
    } = useTripStore();

    const { user, profile, initialized } = useAuthStore();

    // 1. Initial Load Checks
    const isHomeReady = initialized && !!user && !!profile;

    // 2. Local State for Map/Inputs (Orchestration)
    const [pickup, setPickup] = useState<{ lat: number, lng: number, address: string } | null>(null);
    const [destination, setDestination] = useState<{ lat: number, lng: number, address: string } | null>(null);
    const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | null>(null);
    const [selectedService, setSelectedService] = useState('drive');

    // Drawers State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    // UI Feedback State
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Geolocation Setup
    const { latitude, longitude } = useGeolocation(true);
    const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);

    // --- STATE MANAGEMENT ---
    type BottomSheetState = 'HIDDEN' | 'ACTION' | 'SEARCH' | 'SELECT';

    // Derived Logic for Sheet State
    const getSheetState = (): BottomSheetState => {
        if (status !== 'IDLE') return 'HIDDEN'; // Handled by ActiveView
        if (destination) return 'SELECT';
        if (activeInput) return 'SEARCH';
        return 'ACTION';
    };

    const currentSheetState = getSheetState();

    // Unified Flow Entry
    const openSearchFlow = (preSelectedService?: string) => {
        if (preSelectedService) setSelectedService(preSelectedService);
        setActiveInput('destination');
    };

    const handleDismiss = () => {
        setDestination(null);
        setActiveInput(null);
    };

    // --- SHEET STATE ---
    const [sheetSnapIndex, setSheetSnapIndex] = useState(0); // 0=Collapsed/Decision, 1=Expanded

    // Reset snap index when entering select mode (destination set)
    useEffect(() => {
        if (destination) {
            setSheetSnapIndex(0); // Default to Decision (Visible)
        }
    }, [destination]);

    // --- EFFECT: Init Refactored ---
    useEffect(() => {
        // Online Check Handlers (Defined at effect level for access in cleanup)
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const initHome = async () => {
            try {
                window.addEventListener('online', handleOnline);
                window.addEventListener('offline', handleOffline);

                // Initialize Stores safely
                useTripStore.getState().setUserRole('PASSENGER');
                useTripStore.getState().subscribeToTrips();
                useTripStore.getState().fetchSavedPlaces();

                // Validation: If no user/profile after some time, redirect (Safety Net)
                if (!initialized) {
                    const session = await supabase.auth.getSession();
                    if (!session.data.session) {
                        navigate('/login');
                    }
                }
            } catch (err) {
                console.error("Home initialization error:", err);
                setGlobalError("Erro ao inicializar o mapa. Tente recarregar.");
            }
        };

        initHome();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [initialized, navigate]);

    // --- EFFECT: Online Drivers Realtime ---
    useEffect(() => {
        let channel: any;
        const fetchDrivers = async () => {
            // Fetch Initial
            const { data } = await supabase.from('drivers').select('id, lat, lng').eq('is_online', true);
            if (data) setOnlineDrivers(data);

            // Subscribe
            channel = supabase
                .channel('home-drivers-visual')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'drivers', filter: 'is_online=eq.true' },
                    (payload: any) => {
                        const driver = payload.new;
                        setOnlineDrivers((prev: any[]) => {
                            if (!driver) return prev;
                            const exists = prev.find((d: any) => d.id === driver.id);
                            if (exists) {
                                return prev.map((d: any) => d.id === driver.id ? { ...d, lat: driver.lat, lng: driver.lng } : d);
                            }
                            return [...prev, { id: driver.id, lat: driver.lat, lng: driver.lng }];
                        });
                    }
                )
                .subscribe();
        };

        fetchDrivers().catch(console.error);

        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    // --- BACK HANDLER ---
    useBackHandler(() => {
        if (isChatOpen) { setIsChatOpen(false); return true; }
        if (destination && status === 'IDLE') { setDestination(null); return true; }
        if (activeInput) { setActiveInput(null); return true; }
        return false;
    });

    if (!isHomeReady) return <HomeSkeleton />;

    const displayName = profile?.first_name || 'Passageiro';
    const displayAvatar = profile?.avatar_url || null;

    // Derived Map Props
    // Logic: If trip active, use trip details. If IDLE, use local state selection.
    const mapPickup = status === 'IDLE' ? pickup : (tripDetails?.originLat && tripDetails?.originLng ? { lat: tripDetails.originLat, lng: tripDetails.originLng } : null);
    const mapDest = status === 'IDLE' ? destination : (tripDetails?.destLat && tripDetails?.destLng ? { lat: tripDetails.destLat, lng: tripDetails.destLng } : null);

    const handleMapClick = async (lat: number, lng: number) => {
        if (status !== 'IDLE') return; // Map lock during trip?

        // Logic: If selecting destination (default map click behavior)
        if (currentSheetState === 'SEARCH' || currentSheetState === 'SELECT') {
            // In these modes, map click updates destination
            setDestination({ lat, lng, address: 'Carregando...' });
            const addr = await GeoService.reverseGeocode(lat, lng);
            setDestination({ lat, lng, address: addr });
        }
    };



    // Calculate Map Padding based on Sheet State
    const getMapPadding = () => {
        if (currentSheetState === 'SELECT') {
            // New 2-State Logic:
            // Index 0 (Decision) -> ~45% height
            // Index 1 (Expanded) -> Full height
            return sheetSnapIndex === 0 ? window.innerHeight * 0.45 : window.innerHeight * 0.8;
        }
        if (currentSheetState === 'SEARCH') return window.innerHeight * 0.8;
        if (status === 'REQUESTING') return 420;
        return 120; // Default
    };

    const mapPadding = getMapPadding();

    return (
        <div className="mobile-view-container bg-gray-100 relative h-screen w-full overflow-hidden">
            {/* ... (Error/Sync Banners) ... */}
            {!isOnline && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold py-1 px-4 text-center z-[3000]">
                    Sem conexão.
                </div>
            )}
            {/* ... (AnimatePresence for Syn/Error) ... */}
            <AnimatePresence>
                {isSyncing && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full z-[5000] flex items-center gap-2 shadow-lg"
                    >
                        <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Sincronizando...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {globalError && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-xl z-[4000] flex items-center justify-between shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{globalError}</span>
                        </div>
                        <button onClick={() => setGlobalError(null)}><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- LAYOUT SWITCHER --- */}
            {currentSheetState === 'ACTION' ? (
                <div className="absolute inset-0 z-10 bg-gray-50">
                    <HomeDashboard
                        userName={displayName}
                        greeting="Olá"
                        userAvatar={displayAvatar}
                        currentAddress={pickup?.address || 'Localizando...'}
                        onMenuClick={() => navigate('/passenger/menu')}
                        selectedService={selectedService}
                        onServiceSelect={(id) => openSearchFlow(id)}
                        onScheduleClick={() => { }}
                        onRequestClick={() => openSearchFlow()}
                    />
                </div>
            ) : (
                <>
                    {/* --- MAP LAYER --- */}
                    <div className="absolute inset-0 z-0">
                        <Map
                            userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                            driverLocation={undefined}
                            otherDrivers={onlineDrivers}
                            pickupLocation={mapPickup}
                            destinationLocation={mapDest}
                            onMapClick={handleMapClick}
                            tripStatus={status}
                            bottomPadding={mapPadding}
                        />
                    </div>

                    {/* --- DRAWERS --- */}
                    <ChatDrawer
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        receiverName="João Motorista"
                    />
                    <AIAssistantDrawer
                        isOpen={isAiOpen}
                        onClose={() => setIsAiOpen(false)}
                        userRole="passenger"
                    />

                    {/* --- ORCHESTRATION LAYER --- */}
                    <UnifiedBottomSheet
                        snapPoints={
                            currentSheetState === 'SEARCH' ? [0.95] :
                                currentSheetState === 'SELECT' ? [0.63, 0.95] : // Increased to 63% for safe visibility
                                    status === 'REQUESTING' ? [320] :
                                        status === 'ACCEPTED' || status === 'ARRIVED' ? [200, Math.min(window.innerHeight * 0.5, 450)] :
                                            status === 'IN_PROGRESS' ? [160, Math.min(window.innerHeight * 0.5, 450), 0.9] :
                                                status === 'COMPLETED' ? [Math.min(window.innerHeight * 0.55, 500)] : [0.5]
                        }
                        currentIndex={sheetSnapIndex}
                        onSnapChange={(idx) => {
                            setSheetSnapIndex(idx);
                        }}
                        isDismissible={currentSheetState === 'SEARCH'}
                        onDismiss={handleDismiss}
                        Backdrop={false}
                        className="shadow-2xl bg-white/90 backdrop-blur-xl border-t border-white/20"
                    >
                        {status === 'IDLE' ? (
                            <TripRequestForm
                                userName={displayName}
                                greeting="Olá"
                                userAvatar={displayAvatar}
                                currentAddress={pickup?.address || 'Localizando...'}
                                onMenuClick={() => navigate('/passenger/menu')}
                                setDestination={setDestination}
                                setPickup={setPickup}
                                pickup={pickup}
                                destination={destination}
                                activeInput={activeInput}
                                setActiveInput={setActiveInput}
                                onInputFocus={() => { }}
                                initialService={selectedService}
                                currentSnapIndex={sheetSnapIndex}
                            />
                        ) : (
                            <TripActiveView
                                onChatOpen={() => setIsChatOpen(true)}
                            />
                        )}
                    </UnifiedBottomSheet>
                </>
            )}
        </div>
    );
}
