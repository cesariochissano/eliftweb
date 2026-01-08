import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { EliftIntelligence } from '../lib/elift-intelligence';

export type TripStatus = 'IDLE' | 'REQUESTING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TripDetails = {
    id: string;
    serviceId: string;
    origin: string;
    destination: string;
    price: number;
    distance: string; // km
    duration: string; // min
    passengerId?: string;
    driverId?: string;
    paymentMethod?: 'CASH' | 'WALLET';
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    waitingTimeMin?: number;
    waitingTimeCost?: number;
    stops?: any[];
    securityPin?: string;
    isCriticalZone?: boolean;
    basePrice?: number;
    routeAdjustmentCost?: number;
};

export type Message = {
    id: string;
    trip_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    status: 'sending' | 'sent' | 'delivered' | 'read';
    delivered_at?: string;
    read_at?: string;
};

export type PromoCode = {
    id: string;
    code: string;
    description: string;
    type: 'PERCENT' | 'FIXED_AMOUNT';
    value: number;
};

export type SavedPlace = {
    id: string;
    name: string; // 'Casa', 'Trabalho', etc.
    address: string;
    lat: number;
    lng: number;
    type: 'home' | 'work' | 'other';
};

interface TripState {
    status: TripStatus;
    userRole?: 'PASSENGER' | 'DRIVER' | 'FLEET';
    userId?: string; // New: Cache User ID for Realtime
    tripDetails: TripDetails | null;
    tripVersion: number; // New: For conflict resolution
    driverLocation: { lat: number; lng: number } | null;
    cancellationReason: string | null;
    messages: Message[];
    activePromo: PromoCode | null; // New
    savedPlaces: SavedPlace[]; // New (Favorites)
    isSyncing: boolean;
    isActionLoading: boolean;
    isSimulatingArrival: boolean;
    isWaitingActive: boolean; // Bloco 7.4
    waitingStartTime: number | null; // Bloco 7.4
    stopArrivalTime: number | null; // Bloco 7.5

    // Actions
    setUserRole: (role: 'PASSENGER' | 'DRIVER' | 'FLEET') => Promise<void>;
    requestTrip: (details: Omit<TripDetails, 'id'>) => Promise<void>;
    acceptTrip: (tripId: string) => Promise<void>;
    arriveAtPickup: (tripId: string) => Promise<void>;
    startTrip: (tripId: string) => Promise<void>;
    completeTrip: (tripId: string) => Promise<void>;
    cancelTrip: (tripId: string, reason: string) => Promise<void>;
    resetTrip: () => void;
    sendMessage: (trip_id: string, content: string) => Promise<void>;
    markMessagesAsRead: (trip_id: string) => Promise<void>;
    setActivePromo: (promo: PromoCode | null) => void; // New
    addTip: (trip_id: string, amount: number) => Promise<void>;
    setSimulatingArrival: (isSimulating: boolean) => void;
    addStop: (tripId: string, address: string, lat: number, lng: number) => Promise<void>; // Bloco 7.4
    updateWaitingTick: (tripId: string) => Promise<void>; // Bloco 7.4
    setWaitingActive: (active: boolean) => void; // Bloco 7.4
    setAtStop: (tripId: string) => Promise<void>; // Bloco 7.5

    // Resilience Actions
    rehydrateActiveTrip: () => Promise<void>;
    logEvent: (tripId: string, eventType: string, payload?: any) => Promise<void>;

    // Saved Places Actions
    fetchSavedPlaces: () => Promise<void>;
    savePlace: (place: Omit<SavedPlace, 'id'>) => Promise<void>;

    // Realtime
    subscribeToTrips: () => void;
    mapTripToDetails: (trip: any) => TripDetails;

    // Auth
    logout: () => Promise<void>;
}

export const useTripStore = create<TripState>()(
    persist(
        (set, get) => ({
            status: 'IDLE',
            userRole: undefined, // Initialized as undefined, to be set on mount
            userId: undefined,
            tripDetails: null,
            tripVersion: 0,
            driverLocation: null,
            cancellationReason: null,
            messages: [],
            activePromo: null, // New
            savedPlaces: [],
            isSyncing: false,
            isActionLoading: false,
            isSimulatingArrival: false,
            isWaitingActive: false,
            waitingStartTime: null,
            stopArrivalTime: null, // Bloco 7.5

            setSimulatingArrival: (isSimulating) => set({ isSimulatingArrival: isSimulating }),
            setWaitingActive: (active) => set({
                isWaitingActive: active,
                waitingStartTime: active ? Date.now() : null
            }),

            setActivePromo: (promo) => set({ activePromo: promo }),

            fetchSavedPlaces: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data } = await supabase.from('saved_places').select('*').eq('user_id', user.id);
                if (data) set({ savedPlaces: data });
            },

            savePlace: async (place) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Upsert logic based on name+user_id? Or just insert?
                // For simplicity, if type is 'home' or 'work', we update existing.
                if (place.type === 'home' || place.type === 'work') {
                    // Delete existing of same type to avoid duplicates (simplest logic)
                    await supabase.from('saved_places').delete().eq('user_id', user.id).eq('type', place.type);
                }

                const { data, error } = await supabase.from('saved_places').insert({ ...place, user_id: user.id }).select().single();
                if (error) {
                    console.error('Error saving place:', error);
                    return;
                }

                // Update local state
                set(state => ({ savedPlaces: [...state.savedPlaces.filter(p => p.address !== place.address), data] }));
                // Re-fetch to be safe/clean
                get().fetchSavedPlaces();
            },

            setUserRole: async (role) => {
                const { data: { user } } = await supabase.auth.getUser();
                set({ userRole: role, userId: user?.id });
                if (user) {
                    await get().rehydrateActiveTrip();
                }
            },

            setAtStop: async (tripId) => {
                set({ stopArrivalTime: Date.now() });
                get().logEvent(tripId, 'ARRIVED_AT_STOP');
            },

            logEvent: async (tripId, eventType, payload = {}) => {
                const role = get().userRole;
                try {
                    await supabase.from('trip_events').insert({
                        trip_id: tripId,
                        event_type: eventType,
                        actor: role,
                        payload
                    });
                } catch (e) {
                    console.warn('[Audit Log] Failed to save event (table likely missing):', eventType);
                }
            },

            rehydrateActiveTrip: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                set({ isSyncing: true });
                const role = get().userRole;

                try {
                    // Try to find an active trip for this user
                    const query = supabase.from('trips').select('*');

                    if (role === 'DRIVER') {
                        query.eq('driver_id', user.id).not('status', 'in', '("COMPLETED","CANCELLED")');
                    } else {
                        query.eq('passenger_id', user.id).not('status', 'in', '("COMPLETED","CANCELLED")');
                    }

                    const { data: trip, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

                    if (!error && trip) {
                        console.log('[Rehydration] Active trip found:', trip.id, trip.status);
                        set({
                            status: trip.status,
                            tripDetails: get().mapTripToDetails(trip),
                            tripVersion: trip.trip_version || 0
                        });
                        get().subscribeToTrips();
                        get().logEvent(trip.id, 'RESTORED', { status: trip.status });
                    } else if (!trip && get().status !== 'IDLE') {
                        // Trip ended while offline
                        console.log('[Rehydration] No active trip found in DB, resetting local state.');
                        get().resetTrip();
                    }
                } catch (err) {
                    console.error('[Rehydration] Failed:', err);
                } finally {
                    set({ isSyncing: false });
                }
            },

            requestTrip: async (details) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('User not authenticated');

                    // Calculate Final Price with Discount
                    let finalPrice = details.price;
                    const promo = get().activePromo;

                    if (promo) {
                        if (promo.type === 'PERCENT') {
                            finalPrice = details.price * (1 - promo.value / 100);
                        } else {
                            finalPrice = Math.max(0, details.price - promo.value);
                        }
                    }

                    const { data, error } = await supabase
                        .from('trips')
                        .insert({
                            passenger_id: user.id,
                            origin_address: details.origin,
                            destination_address: details.destination,
                            price: finalPrice, // Discounted Price
                            original_price: details.price, // Keep original
                            distance_km: parseFloat(details.distance.replace(' km', '')),
                            duration_min: parseInt(details.duration.replace(' min', '')),
                            status: 'REQUESTING',
                            payment_method: details.paymentMethod || 'CASH', // Default to CASH
                            promo_code_id: promo?.id || null, // Link Promo
                            service_type: details.serviceId, // Store the service ID
                            origin_lat: details.originLat,
                            origin_lng: details.originLng,
                            dest_lat: details.destLat,
                            dest_lng: details.destLng,
                            trip_version: 1,
                            request_key: crypto.randomUUID(),
                            security_pin: (new Date().getHours() >= 22 || new Date().getHours() <= 5)
                                ? Math.floor(1000 + Math.random() * 9000).toString()
                                : null
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    if (data) {
                        set({
                            status: 'REQUESTING',
                            tripDetails: get().mapTripToDetails(data),
                            tripVersion: 1,
                            activePromo: null
                        });
                        get().subscribeToTrips();
                        get().logEvent(data.id, 'REQUESTED', { details });
                    }

                } catch (err) {
                    console.error('Error requesting trip:', err);
                    throw err;
                }
            },

            acceptTrip: async (tripId) => {
                set({ isActionLoading: true });
                try {
                    const { data: { user } = {} } = await supabase.auth.getUser();
                    if (!user) throw new Error('User not authenticated');

                    const { error } = await supabase
                        .from('trips')
                        .update({
                            status: 'ACCEPTED',
                            driver_id: user.id,
                            trip_version: get().tripVersion + 1
                        })
                        .eq('id', tripId);

                    if (error) throw error;
                    get().logEvent(tripId, 'ACCEPTED', { driver_id: user.id });
                } catch (err) {
                    console.error('Error accepting trip:', err);
                } finally {
                    set({ isActionLoading: false });
                }
            },

            arriveAtPickup: async (tripId) => {
                set({ isActionLoading: true });
                try {
                    const newVersion = (get().tripVersion || 0) + 1;
                    // Try with version first
                    let { error } = await supabase.from('trips')
                        .update({ status: 'ARRIVED', trip_version: newVersion })
                        .eq('id', tripId);

                    if (error && error.code === 'PGRST204') { // Column missing
                        console.warn('[Resilience] trip_version missing, falling back...');
                        const fallback = await supabase.from('trips')
                            .update({ status: 'ARRIVED' })
                            .eq('id', tripId);
                        error = fallback.error;
                    }

                    if (error) {
                        console.error('Arrive Error:', error);
                    } else {
                        set({ status: 'ARRIVED', tripVersion: newVersion });
                        get().logEvent(tripId, 'ARRIVED_AT_PICKUP');
                        // Start Grace Period locally (for UI timers)
                        set({ waitingStartTime: Date.now() });
                    }
                } finally {
                    set({ isActionLoading: false });
                }
            },

            startTrip: async (tripId) => {
                set({ isActionLoading: true });
                try {
                    const newVersion = (get().tripVersion || 0) + 1;
                    let { error } = await supabase.from('trips')
                        .update({ status: 'IN_PROGRESS', trip_version: newVersion })
                        .eq('id', tripId);

                    if (error && error.code === 'PGRST204') { // Fallback
                        const fallback = await supabase.from('trips')
                            .update({ status: 'IN_PROGRESS' })
                            .eq('id', tripId);
                        error = fallback.error;
                    }

                    if (error) {
                        console.error('Start Error:', error);
                    } else {
                        set({ status: 'IN_PROGRESS', tripVersion: newVersion, isWaitingActive: false, waitingStartTime: null, stopArrivalTime: null });
                        get().logEvent(tripId, 'STARTED');
                    }
                } finally {
                    set({ isActionLoading: false });
                }
            },

            completeTrip: async (tripId) => {
                const trip = get().tripDetails;
                if (!trip || !trip.driverId) return;

                set({ isActionLoading: true });
                try {
                    // 1. Mark trip as completed
                    const { error: tripError } = await supabase.from('trips').update({ status: 'COMPLETED', trip_version: get().tripVersion + 1 }).eq('id', tripId);
                    if (tripError) {
                        console.error(tripError);
                        return;
                    }
                    // 2. Create Ledger Entries (Transaction)
                    // Credit the driver (Fare)
                    const fare = trip.price;
                    // Debit commission (Platform Fee - 15%)
                    const commission = fare * 0.15;

                    set({ tripVersion: get().tripVersion + 1 });
                    get().logEvent(tripId, 'COMPLETED', { fare: fare, commission: commission });

                    const { error: txError } = await supabase.from('transactions').insert([
                        {
                            driver_id: trip.driverId,
                            trip_id: tripId,
                            amount: fare,
                            type: 'CREDIT',
                            description: `Viagem ${tripId.slice(0, 4)}`
                        },
                        {
                            driver_id: trip.driverId,
                            trip_id: tripId,
                            amount: -commission,
                            type: 'DEBIT',
                            description: 'Comissão da Plataforma (15%)'
                        }
                    ]);

                    if (txError) console.error('Error creating transactions:', txError);
                } finally {
                    set({ isActionLoading: false });
                }
            },

            cancelTrip: async (tripId, reason) => {
                set({ isActionLoading: true });
                try {
                    const newVersion = get().tripVersion + 1;
                    const { error } = await supabase
                        .from('trips')
                        .update({ status: 'CANCELLED', cancellation_reason: reason, trip_version: newVersion })
                        .eq('id', tripId);
                    if (error) {
                        console.error(error);
                    } else {
                        set({ tripVersion: newVersion });
                        get().logEvent(tripId, 'CANCELLED', { reason });
                        get().resetTrip();
                    }
                } finally {
                    set({ isActionLoading: false });
                }
            },

            addStop: async (tripId, address, lat, lng) => {
                const trip = get().tripDetails;
                if (!trip) return;

                // Simulação de impacto de rota (Uber-level)
                // Em produção, isso viria de uma API de mapas comparando rotas
                const simulatedDeltaDist = 0.5 + Math.random() * 2.5; // 0.5km a 3km
                const simulatedDeltaTime = 2 + Math.floor(Math.random() * 8); // 2min a 10min

                const impact = EliftIntelligence.calculateStopImpact({
                    serviceType: trip.serviceId,
                    originalDistanceKm: parseFloat(trip.distance.replace(' km', '')),
                    newDistanceKm: parseFloat(trip.distance.replace(' km', '')) + simulatedDeltaDist,
                    originalDurationMin: parseInt(trip.duration.replace(' min', '')),
                    newDurationMin: parseInt(trip.duration.replace(' min', '')) + simulatedDeltaTime,
                });

                const newStops = [...(trip.stops || []), {
                    address,
                    lat,
                    lng,
                    created_at: new Date().toISOString(),
                    impact_cost: impact.extraCost,
                    delta_dist: impact.deltaDistance,
                    delta_time: impact.deltaTime
                }];
                const newVersion = (get().tripVersion || 0) + 1;

                const { error } = await supabase.from('trips')
                    .update({
                        stops: newStops,
                        trip_version: newVersion,
                        route_adjustment_cost: (trip.routeAdjustmentCost || 0) + impact.extraCost
                    })
                    .eq('id', tripId);

                if (!error) {
                    set({ tripVersion: newVersion });
                    get().logEvent(tripId, 'STOP_ADDED', {
                        address,
                        extra_cost: impact.extraCost,
                        delta_dist: impact.deltaDistance
                    });
                }
            },

            updateWaitingTick: async (tripId) => {
                const trip = get().tripDetails;
                if (!trip) return;

                const { isWaitingActive, stopArrivalTime } = get();

                // Uber-level rule: Wait time during stop activation after 2-min grace period
                let shouldCharge = isWaitingActive;

                if (stopArrivalTime) {
                    const elapsedMin = (Date.now() - stopArrivalTime) / 60000;
                    if (elapsedMin > 2) {
                        shouldCharge = true;
                    }
                }

                if (!shouldCharge) return;

                const newMinutes = (trip.waitingTimeMin || 0) + 1;
                const newCost = newMinutes * 1;
                const newVersion = (get().tripVersion || 0) + 1;

                const { error } = await supabase.from('trips')
                    .update({
                        waiting_time_minutes: newMinutes,
                        waiting_time_cost: newCost,
                        trip_version: newVersion
                    })
                    .eq('id', tripId);

                if (!error) {
                    get().logEvent(tripId, 'WAITING_TIME_TICK', { minutes: newMinutes });
                }
            },

            resetTrip: () => set({
                status: 'IDLE',
                tripDetails: null,
                tripVersion: 0,
                cancellationReason: null,
                messages: [],
                activePromo: null,
                stopArrivalTime: null
            }),

            sendMessage: async (tripId, content) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const optimisticId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substring(2) + Date.now().toString(36);

                const optimisticMessage: Message = {
                    id: optimisticId,
                    trip_id: tripId,
                    sender_id: user.id,
                    content,
                    created_at: new Date().toISOString(),
                    status: 'sending'
                };

                // 1. Optimistic Update (Immediate Feedback)
                set((state) => ({
                    messages: [...state.messages, optimisticMessage]
                }));

                try {
                    const { data, error } = await supabase.from('messages').insert({
                        trip_id: tripId,
                        sender_id: user.id,
                        content
                    }).select().single();

                    if (error) {
                        throw error;
                    }

                    // 2. Clear optimistic and replace with real message data
                    set((state) => ({
                        messages: state.messages.map(m => m.id === optimisticId ? { ...data, status: 'sent' } : m)
                    }));
                } catch (err) {
                    console.error('Final catch in sendMessage:', err);
                    // Revert optimistic if error
                    set((state) => ({
                        messages: state.messages.filter(m => m.id !== optimisticId)
                    }));
                    // Provide a visual hint that it failed? Or just let it disappear as it was before
                    // For now, keeping the disappear logic but it matches why user says "doesn't go"
                }
            },

            markMessagesAsRead: async (tripId) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase
                    .from('messages')
                    .update({ status: 'read', read_at: new Date().toISOString() })
                    .eq('trip_id', tripId)
                    .neq('sender_id', user.id)
                    .neq('status', 'read');
            },

            subscribeToTrips: () => {
                // Remove existing subscriptions if any
                supabase.channel('trips-channel').unsubscribe();

                supabase
                    .channel('trips-channel')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'trips' },
                        (payload: any) => {
                            const state = get();
                            const role = state.userRole;
                            const userId = state.userId;

                            if (!userId) {
                                console.warn('[Realtime] No userId available in store yet.');
                                return;
                            }

                            const newTrip = payload.new;
                            const oldTrip = payload.old;
                            const dbVersion = newTrip?.trip_version || 0;

                            // Deep Sync: Versioning logic
                            if (dbVersion < state.tripVersion && payload.eventType === 'UPDATE') {
                                console.log('[Realtime] Ignored stale update:', dbVersion, '<', state.tripVersion);
                                return;
                            }

                            console.log(`[Realtime Trip Update] Role: ${role}, Event: ${payload.eventType}, New Status: ${newTrip?.status}`);

                            if (!newTrip && payload.eventType !== 'DELETE') return;

                            // DRIVER LOGIC: See new 'REQUESTING' trips or trips assigned to them
                            if (role === 'DRIVER') {
                                // If it's a trip assigned to THIS driver
                                if (newTrip?.driver_id === userId) {
                                    set({ status: newTrip.status, tripDetails: get().mapTripToDetails(newTrip), tripVersion: dbVersion });
                                }
                                // If a trip was accepted by someone else, and we were looking at it
                                else if (oldTrip && !newTrip?.driver_id && get().tripDetails?.id === oldTrip.id && newTrip?.status !== 'REQUESTING') {
                                    set({ status: 'IDLE', tripDetails: null, tripVersion: 0 });
                                }
                            }
                            // PASSENGER LOGIC: Only see updates for THEIR trip
                            else if (role === 'PASSENGER') {
                                const currentTripId = state.tripDetails?.id;

                                if (newTrip?.id === currentTripId || newTrip?.passenger_id === userId) {
                                    console.log(`[Realtime Sync V2.1] Updating to ${newTrip.status} (v${dbVersion})`);
                                    set({ status: newTrip.status, tripDetails: get().mapTripToDetails(newTrip), tripVersion: dbVersion });
                                }
                            }
                        }
                    )
                    .subscribe();

                supabase.channel('messages-channel').unsubscribe();
                supabase
                    .channel('messages-channel')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'messages' }, // Listen to all events (INSERT/UPDATE)
                        async (payload: any) => {
                            const currentTrip = get().tripDetails;
                            if (!currentTrip || payload.new.trip_id !== currentTrip.id) return;

                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

                            if (payload.eventType === 'INSERT') {
                                // 1. If I am the receiver, mark as DELIVERED in the database
                                if (payload.new.sender_id !== user.id && payload.new.status === 'sent') {
                                    supabase.from('messages')
                                        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
                                        .eq('id', payload.new.id)
                                        .then(); // Fire and forget
                                }

                                // 2. Avoid double-adding if it was the local user (handled by optimistic)
                                set((state) => {
                                    const exists = state.messages.some(m => m.id === payload.new.id);
                                    if (exists) return state;
                                    return { messages: [...state.messages, payload.new] };
                                });
                            } else if (payload.eventType === 'UPDATE') {
                                // Handle 'delivered' and 'read' updates
                                set((state) => ({
                                    messages: state.messages.map(m => m.id === payload.new.id ? payload.new : m)
                                }));
                            }
                        }
                    )
                    .subscribe();

                // Initial fetch of messages if there is a trip
                const currentTrip = get().tripDetails;
                if (currentTrip) {
                    supabase
                        .from('messages')
                        .select('*')
                        .eq('trip_id', currentTrip.id)
                        .order('created_at', { ascending: true })
                        .then(({ data }: { data: any }) => {
                            if (data) set({ messages: data });
                        });
                }
            },

            mapTripToDetails: (trip: any): TripDetails => {
                // Defensive parsing for price to avoid NaN
                const rawPrice = trip.price?.toString() || '0';
                const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

                return {
                    id: trip.id,
                    serviceId: trip.service_type || 'drive',
                    origin: trip.origin_address,
                    destination: trip.destination_address,
                    price: cleanPrice,
                    distance: `${trip.distance_km || 0} km`,
                    duration: `${trip.duration_min || 0} min`,
                    passengerId: trip.passenger_id,
                    driverId: trip.driver_id,
                    originLat: trip.origin_lat,
                    originLng: trip.origin_lng,
                    destLat: trip.dest_lat,
                    destLng: trip.dest_lng,
                    waitingTimeMin: trip.waiting_time_minutes,
                    waitingTimeCost: trip.waiting_time_cost,
                    stops: trip.stops,
                    securityPin: trip.security_pin,
                    isCriticalZone: trip.is_critical_zone,
                    basePrice: trip.base_price,
                    routeAdjustmentCost: trip.route_adjustment_cost
                };
            },

            addTip: async (tripId: string, amount: number) => {
                const trip = get().tripDetails;
                if (!trip || !trip.driverId) return;

                // 1. Update trip with tip amount
                const { error: tripError } = await supabase
                    .from('trips')
                    .update({ tip_amount: amount })
                    .eq('id', tripId);

                if (tripError) {
                    console.error('Error adding tip to trip:', tripError);
                    return;
                }

                // 2. Create Transaction (Credit to Customer, Debit to Driver? No, Tip is credit TO driver)
                // Usually tips are paid by passenger. If payment is CASH, driver keeps it. 
                // If payment is WALLET, we transfer from Passenger Wallet to Driver Wallet.
                // For MVP, assuming CASH/WALLET differentiation later.
                // Let's just record the CREDIT to driver's internal ledger for now.

                const { error: txError } = await supabase.from('transactions').insert([
                    {
                        driver_id: trip.driverId,
                        trip_id: tripId,
                        amount: amount,
                        type: 'CREDIT',
                        description: `Gorjeta da Viagem ${tripId.slice(0, 4)}`
                    }
                ]);

                if (txError) console.error('Error creating tip transaction:', txError);
            },

            logout: async () => {
                await supabase.auth.signOut();
                get().resetTrip();
                set({ userRole: undefined, userId: undefined });
                localStorage.removeItem('trip-storage');
            }
        }),
        {
            name: 'trip-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                status: state.status,
                tripDetails: state.tripDetails,
                userRole: state.userRole,
                userId: state.userId,
                tripVersion: state.tripVersion
            }),
        }
    )
);
