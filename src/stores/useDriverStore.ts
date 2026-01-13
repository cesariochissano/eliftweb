import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface TripRequest {
    id: string;
    origin_address: string;
    destination_address: string;
    price: number;
    distance: string;
    duration: string;
    status: 'REQUESTING';
    passenger: {
        first_name: string;
        avatar_url: string | null;
        rating?: number;
    };
}

interface DriverState {
    isOnline: boolean;
    incomingRequests: TripRequest[];
    activeTripId: string | null;
    walletBalance: number;
    fleetType: 'INDIVIDUAL' | 'CORPORATE' | null;

    // Actions
    fetchBalance: (driverId: string) => Promise<void>;
    fetchFleetInfo: (driverId: string) => Promise<void>;
    toggleOnline: (status: boolean) => Promise<void>;
    subscribeToRequests: () => void;
    acceptTrip: (tripId: string, driverId: string) => Promise<void>;
    ignoreRequest: (tripId: string) => void;
    resetDriverState: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
    isOnline: false,
    incomingRequests: [],
    activeTripId: null,
    walletBalance: 0,
    fleetType: null,

    fetchBalance: async (driverId: string) => {
        try {
            const { data, error } = await supabase.rpc('get_driver_balance', { driver_uuid: driverId });
            if (!error && data) {
                const balance = typeof data === 'string' ? parseFloat(data.replace(/[^0-9.-]+/g, '')) : Number(data);
                set({ walletBalance: balance });
            }
        } catch (e) {
            console.warn('[DriverStore] get_driver_balance RPC not found.');
        }
    },

    fetchFleetInfo: async (driverId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('fleet_id')
                .eq('id', driverId)
                .single();

            if (!error && data?.fleet_id) {
                const { data: fleet } = await supabase
                    .from('fleets')
                    .select('type')
                    .eq('id', data.fleet_id)
                    .single();

                if (fleet) set({ fleetType: (fleet as any).type });
            }
        } catch (e) {
            console.warn('[DriverStore] Fleet relationship not found.');
        }
    },

    toggleOnline: async (status: boolean) => {
        set({ isOnline: status });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('drivers').upsert({
                id: user.id,
                is_online: status,
                last_seen: new Date().toISOString()
            });

            if (status) {
                get().subscribeToRequests();
            } else {
                set({ incomingRequests: [] });
                supabase.channel('driver-requests').unsubscribe();
            }
        }
    },

    subscribeToRequests: () => {
        // 1. Initial Fetch: Only get requests created in the last 20 minutes
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

        supabase
            .from('trips')
            .select(`
                *,
                passenger:passenger_id (
                    first_name,
                    avatar_url
                )
            `)
            .eq('status', 'REQUESTING')
            .is('driver_id', null)
            .gt('created_at', twentyMinsAgo) // TIME FILTER
            .then(({ data }: { data: any }) => {
                if (data) {
                    const formatted = data.map((t: any) => ({
                        ...t,
                        distance: t.distance_km ? `${t.distance_km} km` : t.distance,
                        duration: t.duration_min ? `${t.duration_min} min` : t.duration
                    }));
                    set({ incomingRequests: formatted });
                }
            });

        // 2. Realtime Subscription
        supabase
            .channel('driver-requests')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trips', filter: 'status=eq.REQUESTING' },
                async (payload: any) => {
                    // Double check time just in case
                    if (new Date(payload.new.created_at) < new Date(Date.now() - 20 * 60 * 1000)) return;

                    const { data } = await supabase
                        .from('profiles')
                        .select('first_name, avatar_url')
                        .eq('id', payload.new.passenger_id)
                        .single();

                    const newTrip: TripRequest = {
                        id: payload.new.id,
                        origin_address: payload.new.origin_address,
                        destination_address: payload.new.destination_address,
                        price: payload.new.price,
                        distance: payload.new.distance_km ? `${payload.new.distance_km} km` : '0 km',
                        duration: payload.new.duration_min ? `${payload.new.duration_min} min` : '0 min',
                        status: 'REQUESTING',
                        passenger: {
                            first_name: data?.first_name || 'Passageiro',
                            avatar_url: data?.avatar_url || null,
                            rating: 4.8
                        }
                    };

                    set((state) => ({
                        incomingRequests: [...state.incomingRequests.filter(r => r.id !== newTrip.id), newTrip]
                    }));

                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.play().catch(e => console.log('Audio Blocked', e));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'trips' },
                (payload: any) => {
                    // Remove if no longer REQUESTING
                    if (payload.new.status !== 'REQUESTING') {
                        set((state) => ({
                            incomingRequests: state.incomingRequests.filter(r => r.id !== payload.new.id)
                        }));
                    }
                }
            )
            .subscribe();

        // 3. Periodic Cleanup (Every 1 minute)
        // We attach this to the window or a store property to avoid leaks if called multiple times, 
        // but for simplicity in Zustand, we rely on the component using this to handle unmount or just let it run.
        // Better pattern: The caller (Dashboard) should manage the interval or we just check on state updates.
    },

    ignoreRequest: (tripId: string) => {
        set((state) => ({
            incomingRequests: state.incomingRequests.filter(r => r.id !== tripId)
        }));
    },

    acceptTrip: async (tripId: string, driverId: string) => {
        set({ activeTripId: tripId, incomingRequests: [] });

        const { error } = await supabase
            .from('trips')
            .update({
                status: 'ACCEPTED',
                driver_id: driverId,
                updated_at: new Date().toISOString()
            })
            .eq('id', tripId)
            .eq('status', 'REQUESTING');

        if (error) {
            set({ activeTripId: null });
            alert('Desculpe, esta viagem já foi aceite por outro motorista.');
            get().subscribeToRequests();
        } else {
            // Success: Trigger TripStore to pick up the new active trip immediately
            // We use the direct import to avoid circular hook dependency issues if any
            const { useTripStore } = await import('./useTripStore');
            await useTripStore.getState().rehydrateActiveTrip();
        }
    },

    resetDriverState: () => {
        set({ activeTripId: null, incomingRequests: [] });
        get().subscribeToRequests();
    }
}));
