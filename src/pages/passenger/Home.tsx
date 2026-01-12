import { useState, useEffect } from 'react';
import { MapPin, Car, Bike, Phone, MessageSquare, X, AlertCircle, Clock, Ticket, Briefcase, Truck, Shield, Share2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { HomeDashboard } from '../../components/home/HomeDashboard';
import { HomeSkeleton } from '../../components/home/HomeSkeleton';
import { useAuthStore } from '../../stores/useAuthStore';
import { TripNotification, type NotificationType } from '../../components/ui/trip-notification';
import { Input } from '../../components/ui/input';
import Map from '../../components/map/Map';
import { ChatDrawer } from '../../components/ui/chat-drawer';
import { AIAssistantDrawer } from '../../components/ui/ai-assistant-drawer';
import { useTripStore } from '../../stores/useTripStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase } from '../../lib/supabase';
import { EliftIntelligence } from '../../lib/elift-intelligence';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader';
import { useBackHandler } from '../../hooks/useBackHandler';

// Services Configuration
const SERVICES = [
    { id: 'drive', title: 'LiftDrive', desc: 'Viagem premium, carro confortável', icon: Car },
    { id: 'txopela', title: 'LiftTxopela', desc: 'Rápido e econômico na cidade', icon: Ticket },
    { id: 'bike', title: 'LiftBike', desc: 'A opção mais rápida no trânsito', icon: Bike },
    { id: 'carga', title: 'LiftCarga', desc: 'Para mercadorias médias/pesadas', icon: Truck },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};



const formatAddress = (item: any) => {
    const addr = item.address || {};
    // Prioritize specific POI names
    const poi = addr.amenity || addr.shop || addr.leisure || addr.tourism || addr.historic || addr.building || addr.office || addr.public_transport;
    const road = addr.road || addr.street || addr.pedestrian || addr.residential;
    const suburb = addr.suburb || addr.neighbourhood || addr.quarter;
    const city = addr.city || addr.town || addr.village || addr.county;

    let main = poi;
    let contextParts = [];

    // If we have a POI, the road becomes context
    if (main) {
        if (road) contextParts.push(road);
    } else {
        // No POI, so Road is main
        main = road;
    }

    // Add generic context
    if (suburb) contextParts.push(suburb);
    if (city && city !== suburb) contextParts.push(city);

    // Fallback if everything failed (e.g. just coordinates or country)
    if (!main) return item.display_name.split(',').slice(0, 3).join(',');

    // Limit context to prevent huge strings
    const context = contextParts.slice(0, 2).join(', ');

    return context ? `${main}, ${context}` : main;
};

export default function HomePassenger() {
    const navigate = useNavigate();
    const { status, tripDetails, requestTrip, cancelTrip, resetTrip, activePromo, addTip, fetchSavedPlaces, savedPlaces, savePlace, isSyncing, isActionLoading, isSimulatingArrival, setSimulatingArrival, isWaitingActive, stopArrivalTime, updateWaitingTick } = useTripStore();
    const { user, profile, initialized } = useAuthStore();

    // 🟢 Regra de Ouro: Home só renderiza com dados prontos
    const isHomeReady = initialized && !!user && !!profile;

    if (!isHomeReady) {
        return <HomeSkeleton />;
    }

    // Since we are ready, we can safely derive display names
    const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Passageiro';
    const displayAvatar = profile?.avatar_url || null;

    console.log('[HomePassenger Render] Status:', status, 'Trip:', tripDetails?.id);

    {/* Syncing Indicator */ }
    <AnimatePresence>
        {isSyncing && (
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full z-[5000] flex items-center gap-2 shadow-lg"
            >
                <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Sincronizando viagem...</span>
            </motion.div>
        )}
    </AnimatePresence>

    const [selectedService, setSelectedService] = useState('drive');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [savingPlaceType, setSavingPlaceType] = useState<'home' | 'work' | null>(null); // New state for tracking save mode

    // Dynamic Price Calculation using Intelligence
    const isValidPrice = (p: number) => typeof p === 'number' && !isNaN(p) && p > 0;

    // Handle Arrival Simulation
    useEffect(() => {
        if (status === 'ARRIVED') {
            setSimulatingArrival(true);
            const timer = setTimeout(() => {
                setSimulatingArrival(false);
                // Bloco 7.4: Ativar espera após grace period (simulado)
                useTripStore.getState().setWaitingActive(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status, setSimulatingArrival]);

    // Waiting Time Ticker (Bloco 7.4)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isWaitingActive && tripDetails?.id) {
            interval = setInterval(() => {
                updateWaitingTick(tripDetails.id);
            }, 60000);
        }
        return () => clearInterval(interval);
    }, [isWaitingActive, tripDetails?.id]);

    const getPriceForService = (serviceId: string) => {
        let dist = 5; // Default Mock Distance
        let duration = 15; // Default Mock Duration

        if (pickup && destination) {
            dist = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
            duration = Math.max(5, Math.round(dist * 3)); // Estimate 3 min per km + buffer
        }

        const basePrice = EliftIntelligence.calculatePrice({
            distanceKm: dist,
            durationMin: duration,
            serviceType: serviceId,
            basePrice: 0 // Ignored by internal rules
        });

        if (!isValidPrice(basePrice)) return 0; // Guard

        // Apply discount if active
        if (activePromo) {
            if (activePromo.type === 'PERCENT') {
                return Math.round(basePrice * (1 - activePromo.value / 100));
            } else {
                return Math.max(0, basePrice - activePromo.value);
            }
        }
        return basePrice;
    };
    const [isConfirming, setIsConfirming] = useState(false);
    const [orderSummary, setOrderSummary] = useState<{
        price: number;
        originalPrice?: number;
        distance: number;
        duration: number;
        serviceId: string;
    } | null>(null);

    // Pickup & Destination State
    const [pickup, setPickup] = useState<{ lat: number, lng: number, address: string } | null>(null);
    const [destination, setDestination] = useState<{ lat: number, lng: number, address: string } | null>(null);

    // Search and Suggestions State
    const [searchQuery, setSearchQuery] = useState('');

    const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | null>(null);
    const [recentPlaces, setRecentPlaces] = useState<Array<{ lat: number, lng: number, address: string }>>([]);
    const [eta, setEta] = useState<string | null>(null);

    // Tipping State
    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState<number | null>(null);


    const [isChatOpen, setIsChatOpen] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
    const [isAiOpen, setIsAiOpen] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{ visible: boolean; message: string; subMessage?: string; type: NotificationType }>({
        visible: false,
        message: '',
        type: 'default'
    });

    // Monitor Status Changes for Notifications
    useEffect(() => {
        if (status === 'ACCEPTED') {
            setNotification({ visible: true, message: 'Motorista Encontrado!', subMessage: 'João está a caminho.', type: 'success' });
        } else if (status === 'ARRIVED') {
            setNotification({ visible: true, message: 'Motorista Chegou!', subMessage: 'Encontre o motorista no ponto de recolha.', type: 'arrival' });
        } else if (status === 'COMPLETED') {
            setNotification({ visible: true, message: 'Viagem Terminada', subMessage: 'Obrigado por escolher a eLift.', type: 'info' });
        }
    }, [status]);



    // Geolocation & Drivers (Replaced duplicates)

    // Geolocation & Drivers
    const { latitude, longitude } = useGeolocation(true);
    const [onlineDrivers, setOnlineDrivers] = useState<Array<{ id: string; lat: number; lng: number }>>([]);
    const [greeting, setGreeting] = useState('Olá');

    // Offline State
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    useEffect(() => {
        // Set Greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Bom dia');
        else if (hour < 18) setGreeting('Boa tarde');
        else setGreeting('Boa noite');

        fetchSavedPlaces(); // Fetch Favorites
    }, []);

    // Constants for modal content
    const activeService = SERVICES.find(s => s.id === selectedService);

    // --- HELPER FUNCTIONS & HOOKS (Restored) ---

    // calculateDistance is now outside

    // formatAddressUse removed

    const reverseGeocode = async (lat: number, lng: number) => {
        // Google Fallback
        const useGoogle = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (useGoogle) {
            try {
                const results = await getGeocode({ location: { lat, lng } });
                return results[0]?.formatted_address || `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            } catch {
                return `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            }
        }
        // Nominatim Fallback
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: { 'Accept-Language': 'pt' }
            });
            const data = await response.json();
            return formatAddress(data);
        } catch {
            return `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
    };

    // Set initial pickup when geolocation is available
    useEffect(() => {
        const initPickup = async () => {
            if (latitude && longitude && !pickup) {
                const addr = await reverseGeocode(latitude, longitude);
                setPickup({ lat: latitude, lng: longitude, address: addr });
            }
        };
        initPickup();
    }, [latitude, longitude, pickup]);

    // Google Places
    const useGoogle = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    useGoogleMapsLoader();
    // Google Places Otimizado (Bloco 7.6)
    const {
        ready,
        setValue,
        suggestions: { status: googleStatus, data: placeData },
        clearSuggestions: clearGoogleSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: 'mz' },
            locationBias: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
            radius: 50000, // 50km bias para a cidade atual
        },
        debounce: 400,
        initOnMount: useGoogle,
        cache: 24 * 60 * 60, // Cache de 24h para reduzir custos
    });

    const [nominatimSuggestions, setNominatimSuggestions] = useState<any[]>([]);

    const handleAddressSearch = (query: string, type: 'pickup' | 'destination') => {
        setSearchQuery(query);
        setActiveInput(type);
        if (useGoogle && ready) setValue(query);
        setGlobalError(null);
        if (googleStatus === 'ZERO_RESULTS') console.warn('Sem resultados no Google Places para:', query);
    };

    // Derived suggestions (Hybrid)
    const suggestions = useGoogle
        ? placeData.map(p => ({
            place_id: p.place_id,
            description: p.description,
            main_text: p.structured_formatting.main_text,
            secondary_text: p.structured_formatting.secondary_text
        }))
        : nominatimSuggestions.map(item => ({
            place_id: `${item.lat},${item.lng}`,
            description: item.address,
            main_text: item.address.split(',')[0],
            secondary_text: item.address.split(',').slice(1).join(', ')
        }));

    // Nominatim Fallback Effect
    useEffect(() => {
        if (useGoogle) return;

        const timer = setTimeout(async () => {
            if (!searchQuery || searchQuery.length < 3) {
                setNominatimSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=mz`, {
                    headers: { 'Accept-Language': 'pt' }
                });
                const data = await response.json();
                const results = data.map((item: any) => ({
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    address: formatAddress(item)
                }));
                setNominatimSuggestions(results);
                setGlobalError(null);
            } catch (error) {
                setGlobalError('Erro na pesquisa (Fallback).');
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [searchQuery, useGoogle]);

    // Debounced Search Effect (Removed)
    // useEffect(() => {
    //     const timer = setTimeout(async () => {
    //         if (!searchQuery || searchQuery.length < 3) {
    //             setSuggestions([]);
    //             return;
    //         }

    //         try {
    //             // Determine country codes or viewbox if possible for better results
    //             const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=mz`, {
    //                 headers: { 'Accept-Language': 'pt' }
    //             });

    //             if (!response.ok) throw new Error('Falha na rede');

    //             const data = await response.json();
    //             const results = data.map((item: any) => ({
    //                 lat: parseFloat(item.lat),
    //                 lng: parseFloat(item.lon),
    //                 address: formatAddress(item)
    //             }));
    //             setSuggestions(results);
    //             setGlobalError(null);
    //         } catch (error) {
    //             console.error('Search error:', error);
    //             // Only show error if it's not a cancellation/abort (simplified here)
    //             setGlobalError('Não foi possível carregar sugestões. Tente mover o pino no mapa.');
    //         }
    //     }, 800); // 800ms delay for better debouncing

    //     return () => clearTimeout(timer);
    // }, [searchQuery]);

    const handleSelectSuggestion = async (placeId: string, description: string) => {
        let lat, lng, address;

        if (useGoogle) {
            try {
                const results = await getGeocode({ placeId });
                const { lat: gLat, lng: gLng } = await getLatLng(results[0]);
                lat = gLat;
                lng = gLng;
                address = description;
            } catch (error) {
                console.error("Geocoding Error: ", error);
                setGlobalError("Erro ao obter detalhes do local.");
                return;
            }
            clearGoogleSuggestions();
        } else {
            // Fallback Logic (placeId contains "lat,lng")
            const [latStr, lngStr] = placeId.split(',');
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
            address = description;
            setNominatimSuggestions([]);
        }

        if (activeInput === 'pickup') {
            setPickup({ lat, lng, address });
        } else {
            // Check if we are saving a favorite
            if (savingPlaceType) {
                await savePlace({
                    name: savingPlaceType === 'home' ? 'Casa' : 'Trabalho',
                    address: address,
                    lat: lat,
                    lng: lng,
                    type: savingPlaceType
                });
                setSavingPlaceType(null); // Reset mode
                setGlobalError(`${savingPlaceType === 'home' ? 'Casa' : 'Trabalho'} salvo com sucesso!`);
                // Optionally set destination as this place too
                setDestination({ lat, lng, address });
            } else {
                setDestination({ lat, lng, address });
                saveToRecent({ lat, lng, address });
            }
        }
        setSearchQuery('');
        setActiveInput(null);
    };

    const saveToRecent = (place: { lat: number, lng: number, address: string }) => {
        const updated = [place, ...recentPlaces.filter(p => p.address !== place.address)].slice(0, 5);
        setRecentPlaces(updated);
        localStorage.setItem('recentPlaces', JSON.stringify(updated));
    };



    // Subscribe to realtime updates (Trips & Drivers)
    useEffect(() => {
        const { subscribeToTrips, setUserRole } = useTripStore.getState();

        const init = async () => {
            await setUserRole('PASSENGER');
            subscribeToTrips();
        };

        init();

        // Drivers Subscription
        const channel = supabase
            .channel('home-drivers')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'drivers', filter: 'is_online=eq.true' },
                (payload: any) => {
                    const driver = payload.new;
                    setOnlineDrivers((prev: any[]) => {
                        const exists = prev.find((d: any) => d.id === driver.id);
                        if (exists) {
                            return prev.map((d: any) => d.id === driver.id ? { ...d, lat: driver.lat, lng: driver.lng } : d);
                        }
                        return [...prev, { id: driver.id, lat: driver.lat, lng: driver.lng }];
                    });
                }
            )
            .subscribe();

        // Initial Fetch
        supabase.from('drivers').select('id, lat, lng').eq('is_online', true)
            .then(({ data }: { data: any[] | null }) => {
                if (data) setOnlineDrivers(data);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Active Driver & ETA Calculation
    const activeDriver = (status === 'ACCEPTED' || status === 'IN_PROGRESS') && tripDetails?.driverId
        ? onlineDrivers.find((d: any) => d.id === tripDetails.driverId)
        : null;

    useEffect(() => {
        if ((status === 'ACCEPTED' || status === 'IN_PROGRESS') && activeDriver) {
            const target = status === 'ACCEPTED' ? pickup : destination;
            if (target) {
                const dist = calculateDistance(activeDriver.lat, activeDriver.lng, target.lat, target.lng);
                const mins = Math.max(1, Math.round(dist * 2.5)); // Rough estimate: 2.5 min per km
                setEta(`${mins} min`);
            }
        } else {
            setEta(null);
        }
    }, [status, activeDriver, pickup, destination]);

    const handleMapClick = async (lat: number, lng: number) => {
        if (status !== 'IDLE') return;
        setDestination({ lat, lng, address: 'A carregar endereço...' });
        const addr = await reverseGeocode(lat, lng);
        setDestination({ lat, lng, address: addr });
    };

    const handleRequestTrip = () => {
        if (!pickup) {
            if (!latitude) {
                setGlobalError('GPS indisponível. Por favor, digite o local de partida.');
            } else {
                setGlobalError('Por favor, defina o local de partida.');
            }
            return;
        }
        if (!destination) {
            setGlobalError('Por favor, defina o destino.');
            return;
        }
        setGlobalError(null);

        const dist = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
        const duration = Math.max(5, Math.round(dist * 3)); // Estimate 3 min per km

        // Calculate Base Price using Intelligence
        const basePrice = EliftIntelligence.calculatePrice({
            distanceKm: dist,
            durationMin: duration,
            serviceType: selectedService,
            basePrice: 0 // Ignored
        });

        let totalPrice = basePrice;

        // Apply Promo Discount
        if (activePromo) {
            if (activePromo.type === 'PERCENT') {
                totalPrice = Math.round(totalPrice * (1 - activePromo.value / 100));
            } else {
                totalPrice = Math.max(0, totalPrice - activePromo.value);
            }
        }

        setOrderSummary({
            price: totalPrice,
            originalPrice: activePromo ? basePrice : undefined,
            distance: dist,
            duration: duration,
            serviceId: selectedService
        });
        setIsConfirming(true);
    };

    const handleConfirmTrip = async () => {
        if (!orderSummary || !pickup || !destination) return;

        setIsConfirming(false);

        // NOTE: We pass the ORIGINAL price to the store, because the store applies the discount internally.
        // We ensure the store logic expects the original price.
        const priceToSend = orderSummary.originalPrice || orderSummary.price;

        try {
            await requestTrip({
                serviceId: orderSummary.serviceId,
                origin: pickup.address,
                destination: destination.address,
                price: priceToSend,
                distance: `${orderSummary.distance.toFixed(1)} km`,
                duration: `${orderSummary.duration} min`,
                paymentMethod: paymentMethod,
                originLat: pickup.lat,
                originLng: pickup.lng,
                destLat: destination.lat,
                destLng: destination.lng
            });
        } catch (error: any) {
            console.error('Trip Request Failed:', error);
            setGlobalError(`Erro: ${error.message || 'Falha na conexão'}`);
        }
    };

    const handleCancel = async (reason: string) => {
        setIsConfirming(false);
        setShowCancelConfirm(false);
        if (tripDetails?.id) {
            await cancelTrip(tripDetails.id, reason);
            resetTrip();
        }
    };

    // Sheet State Management
    const [sheetState, setSheetState] = useState<'IDLE' | 'SEARCHING' | 'SELECTING'>('IDLE');

    // Update sheet state based on interactions
    useEffect(() => {
        if (status === 'IDLE') {
            if (!destination) {
                // If we are searching or just idle
                if (sheetState === 'SELECTING') setSheetState('IDLE'); // Reset if we came back
            } else {
                // If we have destination, we are selecting
                setSheetState('SELECTING');
            }
        }
    }, [status, destination]);



    const handleCloseSearch = () => {
        setSheetState('IDLE');
        setActiveInput(null);
        setSavingPlaceType(null); // Cancel save mode if closed
    };

    // Calculate drag constraints or snap points based on window height potentially,
    // but for now strict states are safer.

    // Bloco 8.5: Back Stack Management (Prevent Accidental Exit)
    useBackHandler(() => {
        // 1. Close Modals / Overlays
        if (showCancelConfirm) { setShowCancelConfirm(false); return true; }
        if (isConfirming) { setIsConfirming(false); return true; }
        if (isChatOpen) { setIsChatOpen(false); return true; }
        if (isAiOpen) { setIsAiOpen(false); return true; }
        if (showTipModal) { setShowTipModal(false); return true; }
        if (globalError) { setGlobalError(null); return true; }

        // 2. Navigation State Management
        if (sheetState === 'SELECTING') {
            // Back from Route View -> Go to Search to change destination
            setDestination(null); // Clear destination to break useEffect loop
            setSheetState('SEARCHING');
            return true;
        }

        if (sheetState === 'SEARCHING') {
            handleCloseSearch();
            return true;
        }

        // Allow default behavior (exit app / go back) if we are effectively IDLE
        return false;
    });

    return (
        <div className="mobile-view-container bg-gray-100">


            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-red-500 text-white text-xs font-bold py-1 px-4 text-center z-[3000]">
                    Sem conexão com a internet. A tentar reconectar...
                </div>
            )}

            {/* Error Notification */}
            <AnimatePresence>
                {globalError && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-xl z-[2000] flex items-center justify-between shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{globalError}</span>
                        </div>
                        <button
                            onClick={() => setGlobalError(null)}
                            className="text-white/80 hover:text-white"
                        >
                            <Clock size={16} className="rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Drawer */}
            <ChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                receiverName={status === 'ACCEPTED' ? 'João Motorista' : 'Passageiro'}
            />

            {/* Map - Strict 45% Viewport */}
            <div className={`h-map-view transition-all duration-500 relative z-0 ${sheetState === 'SEARCHING' ? 'opacity-30' : 'opacity-100'}`}>
                <Map
                    driverLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                    pickupLocation={tripDetails ? { lat: tripDetails.originLat!, lng: tripDetails.originLng! } : null}
                    destinationLocation={tripDetails ? { lat: tripDetails.destLat!, lng: tripDetails.destLng! } : null}
                    onMapClick={handleMapClick}
                    tripStatus={status}
                    isSimulatingArrival={isSimulatingArrival}
                />
            </div>



            <AIAssistantDrawer
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                userRole="passenger"
            />

            {/* DYNAMIC BOTTOM SHEET - Replaces absolute positioning with flex content */}
            {(status === 'IDLE' || status === 'CANCELLED') && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{
                        y: 0,
                        height: sheetState === 'SEARCHING' ? '100%' : '55vh' // Fill remaining space (100 - 45 = 55)
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`relative z-[600] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col flex-1 ${sheetState === 'SEARCHING' ? 'rounded-none absolute inset-0' : 'rounded-t-[2rem] -mt-6'}`}
                >
                    {/* Search Handle / Header */}
                    <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => {
                        if (sheetState === 'IDLE') setSheetState('SEARCHING');
                        else if (sheetState === 'SEARCHING') setSheetState('IDLE');
                    }}>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                    </div>

                    <div className="flex-1 flex flex-col px-6 pb-safe overflow-hidden">

                        {/* IDLE STATE: Full Screen Dashboard */}
                        {sheetState === 'IDLE' && (
                            <div className="fixed inset-0 z-[1000] bg-gray-50">
                                <HomeDashboard
                                    userName={displayName}
                                    greeting={greeting}
                                    userAvatar={displayAvatar}
                                    currentAddress={pickup?.address || 'Localizando...'}
                                    onMenuClick={() => navigate('/passenger/menu')}
                                    selectedService={selectedService} // Pass state
                                    onServiceSelect={(id) => {
                                        setSelectedService(id);
                                        // Removed automatic navigation to support Dynamic CTA
                                    }}
                                    onScheduleClick={() => alert("Funcionalidade de Agendamento em breve!")}
                                    onRequestClick={() => {
                                        // Use current selectedService (default 'drive') and navigate
                                        setSheetState('SEARCHING');
                                    }}
                                />
                            </div>
                        )}

                        {/* SEARCHING STATE: Full Inputs */}
                        {sheetState === 'SEARCHING' && (
                            <div className="flex flex-col h-full pt-2">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Definir Rota</h2>
                                    <button onClick={handleCloseSearch} className="p-2 bg-gray-100 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3 relative">
                                    {/* Connecting Line */}
                                    <div className="absolute left-[22px] top-[24px] bottom-[24px] w-0.5 bg-gray-200 z-0" />

                                    <div className="relative z-10">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white" />
                                        <Input
                                            autoFocus={!pickup}
                                            placeholder="Local de Partida"
                                            value={activeInput === 'pickup' ? searchQuery : (pickup?.address || '')}
                                            onChange={(e) => handleAddressSearch(e.target.value, 'pickup')}
                                            onFocus={() => {
                                                setActiveInput('pickup');
                                                setSearchQuery(pickup?.address || '');
                                            }}
                                            className="pl-12 bg-gray-50 border-gray-100 h-14 rounded-2xl text-sm font-medium focus:bg-white focus:border-green-500 transition-all"
                                        />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black ring-4 ring-white" />
                                        <Input
                                            autoFocus={!!pickup}
                                            placeholder={savingPlaceType ? `Definir endereço de ${savingPlaceType === 'home' ? 'Casa' : 'Trabalho'}` : "Para onde vai?"}
                                            value={activeInput === 'destination' ? searchQuery : (destination?.address || '')}
                                            onChange={(e) => handleAddressSearch(e.target.value, 'destination')}
                                            onFocus={() => {
                                                setActiveInput('destination');
                                                setSearchQuery(destination?.address || '');
                                            }}
                                            className="pl-12 bg-gray-50 border-gray-100 h-14 rounded-2xl text-sm font-medium focus:bg-white focus:border-black transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Suggestions List */}
                                <div className="mt-4 flex-1 overflow-y-auto">
                                    {(suggestions.length > 0) ? (
                                        <div className="flex flex-col gap-2">
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s.place_id}
                                                    onClick={() => {
                                                        handleSelectSuggestion(s.place_id, s.description);
                                                        if (activeInput === 'destination' && pickup) setSheetState('SELECTING');
                                                        else if (activeInput === 'pickup' && destination) setSheetState('SELECTING');
                                                    }}
                                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                        <MapPin size={20} className="text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{s.main_text}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{s.secondary_text}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-8">
                                            {/* SAVED PLACES SECTION */}
                                            {savedPlaces.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Favoritos</h3>
                                                    {savedPlaces.map((place) => (
                                                        <button
                                                            key={place.id}
                                                            onClick={() => {
                                                                if (activeInput === 'pickup') setPickup({ lat: place.lat, lng: place.lng, address: place.address });
                                                                else {
                                                                    setDestination({ lat: place.lat, lng: place.lng, address: place.address });
                                                                    setSheetState('SELECTING');
                                                                }
                                                                setSearchQuery('');
                                                            }}
                                                            className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left w-full border-b border-gray-50 last:border-0"
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${place.type === 'home' ? 'bg-green-100 text-green-600' : place.type === 'work' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {place.type === 'home' ? <MapPin size={20} /> : place.type === 'work' ? <Briefcase size={20} /> : <MapPin size={20} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-sm text-gray-900">{place.name}</p>
                                                                <p className="text-xs text-gray-500 line-clamp-1">{place.address}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recentes</h3>
                                            {recentPlaces.length > 0 ? recentPlaces.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        if (activeInput === 'pickup') setPickup(s);
                                                        else {
                                                            setDestination(s);
                                                            setSheetState('SELECTING');
                                                        }
                                                        setSearchQuery('');
                                                    }}
                                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left w-full border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                                        <Clock size={20} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-gray-900">{s.address.split(',')[0]}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{s.address}</p>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="text-center text-gray-400 py-4">
                                                    <p>Sem locais recentes</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SELECTING STATE: Services & Payment */}
                        {/* SELECTING STATE: Services & Payment (New Design) */}
                        {sheetState === 'SELECTING' && activeService && (
                            <div className="flex flex-col h-full pt-0 animate-in fade-in slide-in-from-bottom-10 duration-500">

                                {/* Pull Indicator (Visual only, sheet handles drag) */}
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                                {/* 1. Route Info Card (Vertical Flow) */}
                                <div className="bg-gray-50 rounded-[1.5rem] p-4 mb-6 relative">
                                    <div className="flex items-start gap-4">
                                        {/* Route Visualizer */}
                                        <div className="flex flex-col items-center pt-1.5">
                                            <div className="w-3 h-3 bg-[#10d772] rounded-full shadow-[0_0_0_2px_white] z-10" />
                                            <div className="w-0.5 h-10 border-l-2 border-dashed border-gray-300 my-0.5" />
                                            <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_0_2px_white] z-10" />
                                        </div>

                                        {/* Addresses */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="h-8 flex items-center border-b border-gray-100 pb-2">
                                                <p className="text-sm font-medium text-gray-900 truncate pr-2">
                                                    {pickup?.address ? pickup.address.split(',')[0] : 'Local de partida'}
                                                </p>
                                            </div>
                                            <div className="h-4 flex items-center">
                                                <p className="text-sm font-medium text-gray-900 truncate pr-2">
                                                    {destination?.address ? destination.address.split(',')[0] : 'Destino'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setSheetState('SEARCHING')}
                                            className="bg-[#10d772]/10 hover:bg-[#10d772]/20 text-[#10d772] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors self-start mt-1"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Services Selector */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h2 className="text-lg font-bold text-[#101b0d]">Escolha o Serviço</h2>
                                        {/* Distance Info as Tag */}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">
                                            {Math.round(calculateDistance(pickup?.lat || 0, pickup?.lng || 0, destination?.lat || 0, destination?.lng || 0))} km
                                        </span>
                                    </div>

                                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
                                        {SERVICES.map((item) => {
                                            const isSelected = selectedService === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedService(item.id)}
                                                    className={`
                                                        min-w-[120px] h-[140px] snap-center rounded-[1.5rem] p-3 flex flex-col items-center justify-center gap-2 border-2 transition-all relative
                                                        ${isSelected
                                                            ? 'border-gray-100 bg-white shadow-lg scale-100 z-10 ring-1 ring-black/5'
                                                            : 'border-transparent bg-gray-50 scale-95 opacity-70 grayscale-[0.5]'}
                                                    `}
                                                >
                                                    {/* Selection Indicator */}
                                                    {isSelected && <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#10d772] flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                    </div>}

                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${isSelected ? 'bg-[#10d772]/10 text-[#10d772]' : 'bg-white text-gray-400'}`}>
                                                        <item.icon size={24} />
                                                    </div>

                                                    <div className="text-center">
                                                        <p className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{item.title}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-tight px-1">{item.desc}</p>
                                                    </div>

                                                    <div className="mt-auto">
                                                        <span className={`font-extrabold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {isValidPrice(getPriceForService(item.id)) ? `${getPriceForService(item.id)} MT` : '---'}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Payment & Action (Bottom Section) */}
                                <div className="mt-auto">
                                    {/* Payment Selector */}
                                    <div className="flex gap-3 mb-4">
                                        <button
                                            onClick={() => setPaymentMethod('CASH')}
                                            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold border-2 transition-all
                                                ${paymentMethod === 'CASH'
                                                    ? 'border-[#10d772] bg-[#10d772]/10 text-gray-900'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}
                                            `}
                                        >
                                            <span>💵</span> Dinheiro
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('WALLET')}
                                            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold border-2 transition-all
                                                ${paymentMethod === 'WALLET'
                                                    ? 'border-[#3ae012] bg-[#3ae012]/10 text-gray-900'
                                                    : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}
                                            `}
                                        >
                                            <span className="text-base">💳</span> LiftCard
                                        </button>
                                    </div>

                                    {/* Primary Action Button */}
                                    <Button
                                        size="lg"
                                        className="w-full h-14 rounded-3xl bg-black text-white font-bold text-lg shadow-xl shadow-black/20 hover:bg-gray-900 active:scale-[0.98] transition-all"
                                        onClick={handleRequestTrip}
                                        disabled={!isOnline || !isValidPrice(getPriceForService(selectedService))}
                                    >
                                        {!isOnline
                                            ? 'Sem Conexão'
                                            : isValidPrice(getPriceForService(selectedService))
                                                ? `Confirmar ${activeService.title}`
                                                : 'Calculando Preço...'
                                        }
                                    </Button>

                                    <p className="text-center text-[10px] text-gray-400 mt-3 pb-safe">
                                        Ao confirmar, aceita os termos e condições da eLift.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </motion.div>
            )}

            {/* CONFIRMATION / REQUESTING / ACTIVE TRIP UI REMAINS SAME OR CAN BE MODULARIZED */}
            {/* The previous overlays for 'isConfirming', 'REQUESTING', 'ACCEPTED' should ideally be inside the sheet or replace it. 
                For now, I will keep them as overlays on top of the sheet for simplicity, but in a real "BottomSheet" architecture, 
                everything happens inside the sheet container. 
                
                Let's keep the existing logic for 'isConfirming' overlay but ensure it respects the new layout density.
            */}

            {/* CONFIRMATION SCREEN (Review) */}
            {isConfirming && orderSummary && (
                <div className="absolute inset-0 z-[700] bg-black/20 backdrop-blur-sm flex flex-col justify-end">
                    <div className="bg-white rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        {/* ... Existing Confirmation Content ... */}
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

                        <div className="text-center mb-8">
                            <p className="text-gray-500 text-sm font-medium mb-1">Total a Pagar</p>
                            <div className="flex flex-col items-center">
                                {orderSummary.originalPrice && (
                                    <span className="text-lg text-gray-400 line-through decoration-red-500 decoration-2 font-bold select-none">
                                        {orderSummary.originalPrice} MZN
                                    </span>
                                )}
                                <h2 className="text-4xl font-black text-gray-900 flex items-center gap-2">
                                    {(orderSummary.price || 0).toLocaleString()} <span className="text-xl text-gray-400 font-bold">MZN</span>
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-[auto_1fr] gap-3">
                            <Button variant="secondary" className="w-14 h-14 rounded-2xl flex items-center justify-center p-0" onClick={() => setIsConfirming(false)}>
                                <X size={24} />
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                                onClick={handleConfirmTrip}
                                disabled={!isOnline || !orderSummary || !isValidPrice(orderSummary.price) || isActionLoading}
                            >
                                {isActionLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    !isOnline ? 'Sem Conexão' : 'Chamar Motorista Agora'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICATION TOAST */}
            <TripNotification
                isVisible={notification.visible}
                message={notification.message}
                subMessage={notification.subMessage}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
            />

            {/* CONFIRMATION SCREEN (Review) */}
            {isConfirming && orderSummary && (
                <div className="absolute inset-0 z-[700] bg-black/20 backdrop-blur-sm flex flex-col justify-end">
                    <div className="bg-white rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        {/* ... Existing Confirmation Content ... */}
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

                        <div className="text-center mb-8">
                            <p className="text-gray-500 text-sm font-medium mb-1">Total a Pagar</p>
                            <div className="flex flex-col items-center">
                                {orderSummary.originalPrice && (
                                    <span className="text-lg text-gray-400 line-through decoration-red-500 decoration-2 font-bold select-none">
                                        {orderSummary.originalPrice} MZN
                                    </span>
                                )}
                                <h2 className="text-4xl font-black text-gray-900 flex items-center gap-2">
                                    {(orderSummary.price || 0).toLocaleString()} <span className="text-xl text-gray-400 font-bold">MZN</span>
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-[auto_1fr] gap-3">
                            <Button variant="secondary" className="w-14 h-14 rounded-2xl flex items-center justify-center p-0" onClick={() => setIsConfirming(false)}>
                                <X size={24} />
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                                onClick={handleConfirmTrip}
                                disabled={!isOnline || !orderSummary || !isValidPrice(orderSummary.price) || isActionLoading}
                            >
                                {isActionLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    !isOnline ? 'Sem Conexão' : 'Chamar Motorista Agora'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUESTING / SEARCHING DRIVER - BOTTOM SHEET (Not Full Screen) */}
            {status === 'REQUESTING' && (
                <div className="absolute bottom-0 left-0 right-0 z-[800] bg-white rounded-t-[2rem] shadow-[0_-10px_60px_rgba(0,0,0,0.1)] p-6 pb-safe animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 relative shrink-0">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-[#10d772] border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Car size={24} className="text-[#10d772]" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-[#101b0d] mb-1">A procurar motorista...</h2>
                            <p className="text-xs text-gray-500 leading-relaxed">Notificando motoristas próximos. Mantenha o app aberto.</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button variant="outline" className="w-full h-12 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50" onClick={() => setShowCancelConfirm(true)}>
                            Cancelar Pedido
                        </Button>
                    </div>
                </div>
            )}

            {/* ACTIVE TRIP OVERLAY */}
            {(status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS' || status === 'COMPLETED') && tripDetails && (
                <div className="absolute bottom-0 left-0 right-0 z-[600] bg-white rounded-t-[2rem] shadow-[0_-10px_60px_rgba(0,0,0,0.1)] pb-safe animate-in slide-in-from-bottom duration-500">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-gray-200">JM</div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">João Motorista</h3>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">★ 4.9</div>
                                            <span className="text-sm text-gray-500">Toyota Ractis • ABH 123 MP</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#10d772] uppercase tracking-wider mt-0.5">
                                            {tripDetails.serviceId === 'drive' ? 'LiftDrive' :
                                                tripDetails.serviceId === 'bike' ? 'LiftBike' :
                                                    tripDetails.serviceId === 'txopela' ? 'LiftTxopela' : 'LiftCarga'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase">Valor</p>
                                <div className="font-black text-xl">{(tripDetails.price || 0).toLocaleString()} MT</div>
                                {tripDetails.waitingTimeMin! > 0 && (
                                    <div className="text-[10px] text-orange-500 font-bold">+ {tripDetails.waitingTimeCost} MT Espera</div>
                                )}
                                {tripDetails.routeAdjustmentCost! > 0 && (
                                    <div className="text-[10px] text-blue-500 font-bold">+ {tripDetails.routeAdjustmentCost} MT Paragens</div>
                                )}
                            </div>
                        </div>

                        {/* PIN de Segurança (Bloco 7.4) */}
                        {tripDetails.securityPin && (status === 'ACCEPTED' || status === 'ARRIVED') && (
                            <div className="mb-4 bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">PIN de Segurança</p>
                                        <p className="text-xs text-gray-700">Confirme este PIN com o motorista</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-black tracking-[4px] text-gray-900 bg-white px-4 py-2 rounded-xl shadow-inner border border-gray-100">
                                    {tripDetails.securityPin}
                                </div>
                            </div>
                        )}

                        {/* Status Progress */}
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 relative overflow-hidden">
                            <div className={`absolute top-0 left-0 bottom-0 ${isWaitingActive ? 'bg-orange-50' : 'bg-green-50'} w-full`} />
                            <div className="relative flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 ${isWaitingActive ? 'bg-orange-500' : 'bg-green-500'} rounded-full animate-pulse`} />
                                    <span className="font-bold text-gray-900">
                                        {isWaitingActive ? `Em Espera (${tripDetails.waitingTimeMin} min)` :
                                            stopArrivalTime ? `Paragem (${tripDetails.waitingTimeMin || 0} min)` :
                                                isSimulatingArrival ? 'O motorista chegou ao ponto de recolha' :
                                                    status === 'ACCEPTED' ? `Motorista a caminho (${eta || '2 min'})` :
                                                        status === 'ARRIVED' ? 'Motorista chegou!' :
                                                            status === 'IN_PROGRESS' ? 'Em viagem ao destino' : 'Viagem terminada'}
                                    </span>
                                </div>
                                {isWaitingActive && (
                                    <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg animate-bounce">
                                        +1 MT/MIN
                                    </span>
                                )}
                            </div>
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

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-12 rounded-xl font-bold border-gray-200" onClick={() => {/* Call */ }}>
                                <Phone size={18} className="mr-2" /> Ligar
                            </Button>
                            <Button className="h-12 rounded-xl font-bold bg-black text-white" onClick={() => setIsChatOpen(true)}>
                                <MessageSquare size={18} className="mr-2" /> Chat
                            </Button>
                        </div>

                        {status !== 'COMPLETED' && (
                            <button onClick={() => setShowCancelConfirm(true)} className="w-full text-center text-red-400 text-xs font-bold mt-6 py-2">
                                Cancelar Viagem
                            </button>
                        )}
                        {status === 'COMPLETED' && (
                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl border-gray-200 font-bold"
                                    onClick={() => {
                                        // TODO: Implement Rating
                                        console.log('Open Rating');
                                    }}
                                >
                                    Avaliar
                                </Button>
                                <Button
                                    className="flex-1 h-12 rounded-xl bg-[#3ae012] text-white font-bold hover:bg-[#32c90f]"
                                    onClick={() => setShowTipModal(true)}
                                >
                                    Gorjeta
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-12 w-12 rounded-xl border border-gray-100"
                                    onClick={() => resetTrip()}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TIP MODAL */}
            {showTipModal && tripDetails && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTipModal(false)} />

                    <div className="bg-white w-full rounded-t-[2rem] p-6 z-10 animate-in slide-in-from-bottom duration-300 pb-safe relative">
                        {/* Driver Info Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 overflow-hidden border-2 border-white shadow-lg">
                                {/* Placeholder Avatar */}
                                <img src="https://via.placeholder.com/80" alt="Driver" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Armando Timane</h2>
                            <p className="text-sm text-gray-500">Mazda Demio • HS785K</p>
                        </div>

                        <h3 className="text-center font-bold text-lg mb-6">Valor da Gorjeta</h3>

                        {/* Tip Options */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {[20, 50, 100, 200].map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setTipAmount(amount)}
                                    className={`h-14 rounded-2xl font-bold text-lg transition-all border-2 ${tipAmount === amount
                                        ? 'bg-[#3ae012] text-white border-[#3ae012]'
                                        : 'bg-white text-gray-900 border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>

                        <div className="text-center mb-8">
                            <p className="text-gray-500 text-xs px-8">
                                Gorjeta é bem vinda, mas não é obrigatória. Você deve decidir o valor.
                            </p>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl bg-[#3ae012] text-white font-bold text-lg shadow-xl shadow-green-200 mb-3"
                            onClick={async () => {
                                if (tipAmount) {
                                    await addTip(tripDetails.id, tipAmount);
                                    alert(`Gorjeta de ${tipAmount} MT enviada!`);
                                }
                                setShowTipModal(false);
                                resetTrip();
                            }}
                            disabled={!tipAmount}
                        >
                            Enviar
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-gray-400 font-bold"
                            onClick={() => {
                                setShowTipModal(false);
                                resetTrip();
                            }}
                        >
                            Não enviar gorjeta
                        </Button>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-center mb-2">Cancelar Viagem?</h2>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            Poderá ser cobrada uma taxa se o motorista já estiver muito próximo.
                        </p>

                        <div className="space-y-3">
                            <Button
                                className="w-full h-12 rounded-xl font-bold bg-black text-white hover:bg-black/90"
                                onClick={() => handleCancel('USER_REQUESTED')}
                            >
                                Sim, Cancelar
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-xl font-bold"
                                onClick={() => setShowCancelConfirm(false)}
                            >
                                Não, Manter Viagem
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
