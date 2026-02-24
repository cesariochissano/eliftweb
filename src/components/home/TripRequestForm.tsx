import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Wallet, Banknote, MessageSquare } from 'lucide-react';
import DestinationHeader from './DestinationHeader';
// import { HomeDashboard } from './HomeDashboard'; // Lifted to Home.tsx
import { useTripStore } from '../../stores/useTripStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { EliftIntelligence } from '../../lib/elift-intelligence';
import { GeoService } from '../../services/geo.service';
import { Skeleton } from '../ui/skeleton';

// Assets
import car3d from '../../assets/3d/car_3d.png';
import bike3d from '../../assets/3d/bike_3d.png';
import tuktuk3d from '../../assets/3d/tuktuk_3d.png';
import truck3d from '../../assets/3d/truck_3d.png';

interface TripRequestFormProps {
    userName: string;
    greeting: string;
    userAvatar: string | null;
    currentAddress: string;
    onMenuClick: () => void;
    setDestination: (dest: { lat: number, lng: number, address: string } | null) => void;
    setPickup: (pickup: { lat: number, lng: number, address: string } | null) => void;
    pickup: { lat: number, lng: number, address: string } | null;
    destination: { lat: number, lng: number, address: string } | null;
    activeInput: 'pickup' | 'destination' | null;
    setActiveInput: (val: 'pickup' | 'destination' | null) => void;
    initialService?: string;
    currentSnapIndex?: number;
}

const SERVICES = [
    { id: 'drive', title: 'Lift Drive', desc: 'Viagem premium, carro confortável' },
    { id: 'txopela', title: 'Lift Txopela', desc: 'Rápido e econômico na cidade' },
    { id: 'bike', title: 'Lift Bike', desc: 'A opção mais rápida no trânsito' },
    { id: 'carga', title: 'Lift Carga', desc: 'Para mercadorias médias/pesadas' },
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
    return R * c;
};

const getAddressSafe = (location: any): string => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    return location.address || '';
};

export function TripRequestForm({
    // userName,
    // greeting,
    // userAvatar,
    // currentAddress,
    // onMenuClick,
    setDestination,
    setPickup,
    pickup,
    destination,
    activeInput,
    setActiveInput,
    // onInputFocus,
    initialService = 'drive',
    currentSnapIndex = 0 // Changed default to 0 for 2-State logic
}: TripRequestFormProps & { onInputFocus?: () => void }) {
    const { requestTrip, activePromo, isActionLoading } = useTripStore();
    const { wallet, fetchWallet } = useWalletStore(); // Integration for balance check

    // Internal State for this form
    const [sheetState, setSheetState] = useState<'IDLE' | 'SEARCHING' | 'SELECTING'>(
        activeInput ? 'SEARCHING' : 'IDLE'
    );
    // Payment Method State (Persisted)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'WALLET'>(() => {
        const saved = localStorage.getItem('default_payment_method');
        return saved === 'WALLET' ? 'WALLET' : 'CASH';
    });
    const [selectedService, setSelectedService] = useState(initialService);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [orderSummary, setOrderSummary] = useState<{
        price: number;
        originalPrice?: number;
        distance: number;
        duration: number;
        serviceId: string;
    } | null>(null);

    // Pro Mode State
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [driverNotes, setDriverNotes] = useState('');
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [isCalculating, setIsCalculating] = useState(false);

    // Sync sheet state with parent/props
    useEffect(() => {
        if (activeInput && sheetState === 'IDLE') {
            setSheetState('SEARCHING');
        }
    }, [activeInput, sheetState]);

    useEffect(() => {
        if (destination) {
            setSheetState('SELECTING');
        } else if (sheetState === 'SELECTING') {
            setSheetState('SEARCHING');
        }
    }, [destination]);

    // Fetch wallet balance on mount to ensure we have data for validation
    useEffect(() => {
        fetchWallet();
    }, []);

    // Persist selection
    const handleSetPaymentMethod = (method: 'CASH' | 'WALLET') => {
        setSelectedPaymentMethod(method);
        localStorage.setItem('default_payment_method', method);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            const results = await GeoService.searchPlaces(query);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectPlace = (place: any) => {
        if (activeInput === 'pickup') {
            setPickup(place);
        } else {
            setDestination(place);
        }
        setSearchQuery('');
        setSuggestions([]);
        setActiveInput(null);
    };

    const handleRequest = async () => {
        if (!pickup || !destination || !orderSummary) return;

        const priceToSend = orderSummary.originalPrice || orderSummary.price;

        // Balance Check if Wallet Check
        if (selectedPaymentMethod === 'WALLET') {
            if (!wallet || wallet.balance < priceToSend) {
                alert(`Saldo insuficiente (${wallet?.balance?.toFixed(0) || 0} MT). Por favor carregue sua carteira ou selecione Dinheiro.`);
                return;
            }
        }

        await requestTrip({
            serviceId: orderSummary.serviceId,
            origin: pickup.address,
            destination: destination.address,
            price: priceToSend,
            distance: `${orderSummary.distance.toFixed(1)} km`,
            duration: `${orderSummary.duration} min`,
            paymentMethod: selectedPaymentMethod,
            originLat: pickup.lat,
            originLng: pickup.lng,
            destLat: destination.lat,
            destLng: destination.lng,
            // Pro Mode Data
            guestName: isGuestMode ? guestName : undefined,
            guestPhone: isGuestMode ? guestPhone : undefined,
            notes: driverNotes
        });
    };

    // Calculate Price Effect
    useEffect(() => {
        if (pickup && destination) {
            setIsCalculating(true);
            const dist = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
            const duration = Math.max(5, Math.round(dist * 3)); // Estimate

            const newPrices: Record<string, string> = {};
            let currentOrderSummary = null;

            SERVICES.forEach(service => {
                const basePrice = EliftIntelligence.calculatePrice({
                    distanceKm: dist,
                    durationMin: duration,
                    serviceType: service.id,
                    basePrice: 0
                });

                let totalPrice = basePrice;
                if (activePromo) {
                    if (activePromo.type === 'PERCENT') {
                        totalPrice = Math.round(totalPrice * (1 - activePromo.value / 100));
                    } else {
                        totalPrice = Math.max(0, totalPrice - activePromo.value);
                    }
                }
                newPrices[service.id] = totalPrice.toFixed(0);

                if (service.id === selectedService) {
                    currentOrderSummary = {
                        price: totalPrice,
                        originalPrice: activePromo ? basePrice : undefined,
                        distance: dist,
                        duration: duration,
                        serviceId: selectedService
                    };
                }
            });

            setPrices(newPrices);
            setOrderSummary(currentOrderSummary);
            setIsCalculating(false);
        } else {
            setPrices({});
            setOrderSummary(null);
        }
    }, [pickup, destination, selectedService, activePromo]);


    // ... (props interface update happens automatically if I just use it, but good to be explicit for TS)

    // Helper to check view state
    // New 2-State System: 0 = Normal/Decision, 1 = Expanded/Details
    const isExpanded = currentSnapIndex === 1;

    return (
        <div className="flex flex-col h-full relative">

            {/* 1. HEADER SECTION (Inputs or Route View) */}
            <div className={`px-6 pt-2 pb-2 transition-all duration-300 ${destination ? 'opacity-100' : ''}`}>
                {!destination ? (
                    // SEARCH MODE (Existing Inputs)
                    <div className="flex flex-col gap-4">
                        {/* Origin Input */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_0_2px_white]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Local de partida"
                                className={`w-full h-14 pl-12 pr-4 bg-gray-50 rounded-2xl text-[17px] font-medium placeholder:text-gray-400 border transition-all ${activeInput === 'pickup' ? 'border-[#10d772] bg-white ring-4 ring-[#10d772]/10' : 'border-transparent hover:bg-gray-100'}`}
                                value={activeInput === 'pickup' ? searchQuery : getAddressSafe(pickup)}
                                onFocus={() => {
                                    setActiveInput('pickup');
                                    setSearchQuery(getAddressSafe(pickup));
                                    setSheetState('SEARCHING');
                                }}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Destination Input */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                <div className="w-2 h-2 rounded-full bg-[#10d772] shadow-[0_0_0_2px_white]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Para onde vamos?"
                                className={`w-full h-14 pl-12 pr-4 bg-gray-50 rounded-2xl text-[17px] font-medium placeholder:text-gray-400 border transition-all ${activeInput === 'destination' ? 'border-[#10d772] bg-white ring-4 ring-[#10d772]/10' : 'border-transparent hover:bg-gray-100'}`}
                                value={activeInput === 'destination' ? searchQuery : getAddressSafe(destination)}
                                onFocus={() => {
                                    setActiveInput('destination');
                                    setSearchQuery(getAddressSafe(destination));
                                    setSheetState('SEARCHING');
                                }}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                ) : (
                    // SELECT MODE (New Destination Header - Compact)
                    <DestinationHeader
                        origin={pickup?.address || 'Sua localização atual'}
                        destination={destination.address}
                        onEdit={() => {
                            setDestination(null);
                            setActiveInput('destination');
                            setSheetState('SEARCHING');
                        }}
                    />
                )}
            </div>

            {/* 2. MAIN CONTENT (Conditional) */}
            {destination && (
                <div className="flex-1 px-4 pb-safe-bottom">
                    {/* CHANGED: px-6 -> px-4 for tighter fit, removed 'pb-6' relying on safe-bottom */}

                    {/* ALWAYS VISIBLE: SELECTION CONTROLS */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pt-2">

                        {/* Summary Info (Distance/Time) - Subtle above carousel */}
                        {orderSummary && (
                            <div className="flex justify-center mb-3">
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Clock size={12} />
                                    {orderSummary.distance.toFixed(1)} km • ~{orderSummary.duration} min
                                </span>
                            </div>
                        )}

                        {/* Horizontal Service Carousel */}
                        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4 -mx-4 px-4 snap-x snap-mandatory">
                            {SERVICES.map(s => (
                                <motion.div
                                    key={s.id}
                                    onClick={() => setSelectedService(s.id)}
                                    initial={false}
                                    animate={{
                                        scale: selectedService === s.id ? 1.05 : 1,
                                        borderColor: selectedService === s.id ? '#10d772' : '#e5e7eb',
                                        backgroundColor: selectedService === s.id ? '#ffffff' : '#ffffff'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`snap-center shrink-0 w-[110px] flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-colors cursor-pointer relative overflow-hidden ${selectedService !== s.id ? 'border-gray-100' : 'shadow-xl shadow-green-900/10'}`}
                                >
                                    {/* Active Background Glow */}
                                    {selectedService === s.id && (
                                        <motion.div
                                            layoutId="activeGlow"
                                            className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent z-0"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}

                                    {/* Active Indicator (Dot) */}
                                    {selectedService === s.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-3 right-3 w-2 h-2 bg-[#10d772] rounded-full shadow-sm z-10"
                                        />
                                    )}

                                    {/* Icon (Top) */}
                                    <div className="h-14 w-full flex items-center justify-center mb-2 z-10">
                                        {s.id === 'drive' && <img src={car3d} className="w-full h-full object-contain drop-shadow-md" />}
                                        {s.id === 'txopela' && <img src={tuktuk3d} className="w-full h-full object-contain drop-shadow-md" />}
                                        {s.id === 'bike' && <img src={bike3d} className="w-full h-full object-contain drop-shadow-md" />}
                                        {s.id === 'carga' && <img src={truck3d} className="w-full h-full object-contain drop-shadow-md" />}
                                    </div>

                                    {/* Info (Bottom) */}
                                    <div className="flex flex-col items-center gap-1 w-full z-10">
                                        <span className="text-xs font-bold text-gray-600">{s.title}</span>
                                        {isCalculating ? (
                                            <Skeleton className="h-4 w-16 bg-gray-100 rounded-full" />
                                        ) : (
                                            <span className={`text-sm font-black ${selectedService === s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {prices[s.id] || '---'} MT
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Shared Footer (Payment + Confirm) */}
                        <div className="flex flex-col gap-4 mt-1 mb-2">
                            {/* Reduced margins: mt-2 -> mt-1, mb-6 -> mb-2 */}

                            {/* Payment Method Selector (Split Button) */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSetPaymentMethod('CASH')}
                                    className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border-2 active:scale-95 transition-all ${selectedPaymentMethod === 'CASH' ? 'bg-[#101b0d] text-white border-[#101b0d] shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                >
                                    <Banknote className={`w-4 h-4 ${selectedPaymentMethod === 'CASH' ? 'text-[#10d772]' : 'text-gray-400'}`} />
                                    <span className="font-bold text-sm">Dinheiro</span>
                                </button>
                                <button
                                    onClick={() => handleSetPaymentMethod('WALLET')}
                                    className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border-2 active:scale-95 transition-all ${selectedPaymentMethod === 'WALLET' ? 'bg-[#101b0d] text-white border-[#101b0d] shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                >
                                    <Wallet className={`w-4 h-4 ${selectedPaymentMethod === 'WALLET' ? 'text-[#10d772]' : 'text-gray-400'}`} />
                                    <span className="font-bold text-sm">Carteira</span>
                                </button>
                            </div>

                            {/* CONFIRM BUTTON (Huge Black CTA) */}
                            <button
                                className="w-full h-14 bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center relative overflow-hidden"
                                onClick={handleRequest}
                                disabled={!orderSummary || isActionLoading}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isActionLoading ? (
                                        <Clock className="animate-spin w-6 h-6" />
                                    ) : (
                                        <>
                                            Confirmar {SERVICES.find(s => s.id === selectedService)?.title}
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* PRO MODE: Expanded Features (Only visible in Expanded state) */}
                    {isExpanded && (
                        <div className="flex flex-col gap-1 pt-6 border-t border-gray-100/50 animate-in fade-in slide-in-from-bottom-10">
                            <div className="flex items-center gap-2 mb-4 opacity-50">
                                <div className="h-[1px] flex-1 bg-gray-200"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preferências & Extras</span>
                                <div className="h-[1px] flex-1 bg-gray-200"></div>
                            </div>

                            {/* Pro Features (Guest / Notes) */}
                            <div className="bg-white rounded-2xl p-0 transition-all mb-4">
                                <div
                                    className="flex items-center justify-between cursor-pointer py-3"
                                    onClick={() => setIsGuestMode(!isGuestMode)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isGuestMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">Pedir para outra pessoa</span>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isGuestMode ? 'bg-[#10d772]' : 'bg-gray-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isGuestMode ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                {isGuestMode && (
                                    <div className="mb-4 flex flex-col gap-3 pl-11">
                                        <input
                                            type="text"
                                            placeholder="Nome do Passageiro"
                                            className="w-full h-10 rounded-lg bg-gray-50 border-0 px-3 text-sm font-medium focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Número de Telefone (+258...)"
                                            className="w-full h-10 rounded-lg bg-gray-50 border-0 px-3 text-sm font-medium focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="py-2">
                                <div className="flex gap-2 flex-wrap mb-3">
                                    {['Estou na portaria', 'Trago bagagem', 'Tenho troco'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setDriverNotes(prev => prev.includes(tag) ? prev.replace(tag, '').trim() : `${prev} ${tag}`.trim())}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${driverNotes.includes(tag) ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        placeholder="Adicionar nota para o motorista..."
                                        className="w-full h-16 rounded-xl bg-gray-50 border-0 p-3 pl-10 text-sm font-medium focus:bg-gray-100 outline-none resize-none transition-all placeholder:text-gray-400"
                                        value={driverNotes}
                                        onChange={(e) => setDriverNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results (When no destination) */}
            {!destination && suggestions.length > 0 && (
                <div className="px-6 flex-1 overflow-y-auto absolute top-[160px] left-0 right-0 bg-white z-10">
                    <div className="flex flex-col gap-2">
                        {suggestions.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer active:scale-[0.99] transition-transform"
                                onClick={() => handleSelectPlace(item)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1 border-b border-gray-100 pb-3">
                                    <h4 className="font-bold text-gray-900 text-fluid-body">{item.address.split(',')[0]}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.address}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

