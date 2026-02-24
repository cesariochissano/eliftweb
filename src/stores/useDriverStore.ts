import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types/wallet';

interface DriverMetrics {
    tripsToday: number;
    earningsToday: number;
    rating: number;
    acceptanceRate: number;
}

interface IncomingRequest {
    id: string;
    origin: string;
    destination: string;
    price: number;
    distance: string;
    duration: string;
    passenger: {
        first_name: string;
        avatar_url: string | null;
    };
    [key: string]: any;
}

interface DriverState {
    isOnline: boolean;
    metrics: DriverMetrics;
    isLocationTracking: boolean;
    incomingRequests: IncomingRequest[];
    walletBalance: number;
    fleetType: 'INDIVIDUAL' | 'CORPORATE';

    // Actions
    setOnlineStatus: (status: boolean) => Promise<void>;
    updateLocation: (lat: number, lng: number) => Promise<void>;
    fetchMetrics: () => Promise<void>;

    // Request Actions
    addRequest: (req: IncomingRequest) => void;
    ignoreRequest: (reqId: string) => void;
    acceptTrip: (reqId: string, driverId: string) => Promise<void>;

    // Financials
    fetchBalance: (userId: string) => Promise<void>;
    fetchFleetInfo: (userId: string) => Promise<void>;
    toggleOnline: (status: boolean) => Promise<void>; // Alias for setOnlineStatus with checks
}

export const useDriverStore = create<DriverState>()(
    persist(
        (set, get) => ({
            isOnline: false,
            isLocationTracking: false,
            incomingRequests: [],
            walletBalance: 0,
            fleetType: 'INDIVIDUAL',
            metrics: {
                tripsToday: 0,
                earningsToday: 0,
                rating: 0,
                acceptanceRate: 100
            },

            setOnlineStatus: async (status: boolean) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { error } = await supabase
                        .from('drivers')
                        .update({ is_online: status })
                        .eq('id', user.id);

                    if (error) throw error;

                    set({ isOnline: status, isLocationTracking: status });
                } catch (err) {
                    console.error('Failed to set online status:', err);
                }
            },

            toggleOnline: async (status) => {
                return get().setOnlineStatus(status);
            },

            updateLocation: async (lat, lng) => {
                if (!get().isOnline) return;
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { error } = await supabase
                    .from('drivers')
                    .update({ lat, lng, last_seen: new Date().toISOString() })
                    .eq('id', user.id);

                if (error) console.error('Loc update failed', error);
            },

            fetchMetrics: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                try {
                    // 1. Contar viagens concluídas hoje
                    const { count: tripsToday } = await supabase
                        .from('trips')
                        .select('*', { count: 'exact', head: true })
                        .eq('driver_id', user.id)
                        .eq('status', 'COMPLETED')
                        .gte('created_at', today.toISOString());

                    // 2. Somar ganhos de hoje (Transações tipo CREDIT ligadas a viagens)
                    const { data: earnings } = await supabase
                        .from('transactions')
                        .select('amount')
                        .eq('driver_id', user.id)
                        .eq('type', 'CREDIT')
                        .gte('created_at', today.toISOString());

                    const earningsToday = earnings?.reduce((acc: number, tx: Pick<Transaction, 'amount'>) => acc + (tx.amount || 0), 0) || 0;

                    // 3. Obter rating médio (Simulado por enquanto ou da tabela de profiles/drivers se existir)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('rating')
                        .eq('id', user.id)
                        .single();

                    set({
                        metrics: {
                            tripsToday: tripsToday || 0,
                            earningsToday: earningsToday,
                            rating: profile?.rating || 5.0,
                            acceptanceRate: 98 // Manter fixo ou calcular se houver logs de rejeição
                        }
                    });
                } catch (err) {
                    console.error('Error fetching driver metrics:', err);
                }
            },

            fetchBalance: async (userId) => {
                try {
                    const { data: wallet } = await supabase
                        .from('wallets')
                        .select('balance')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (wallet) {
                        set({ walletBalance: wallet.balance });
                    }
                } catch (err) {
                    console.error('Error fetching wallet balance:', err);
                }
            },

            fetchFleetInfo: async (userId) => {
                try {
                    const { data: driver } = await supabase
                        .from('drivers')
                        .select('fleet_type')
                        .eq('id', userId)
                        .single();

                    if (driver) {
                        set({ fleetType: driver.fleet_type as any });
                    }
                } catch (err) {
                    console.error('Error fetching fleet info:', err);
                }
            },

            addRequest: (req) => {
                set((state) => ({ incomingRequests: [...state.incomingRequests, req] }));
            },

            ignoreRequest: (reqId) => {
                set((state) => ({ incomingRequests: state.incomingRequests.filter(r => r.id !== reqId) }));
            },

            acceptTrip: async (tripId, driverId) => {
                try {
                    const { error } = await supabase
                        .from('trips')
                        .update({
                            status: 'ACCEPTED',
                            driver_id: driverId,
                            trip_version: 1, // basic increment or fetch? Assuming 1 for new assignment
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', tripId);

                    if (error) throw error;

                    // Clear requests
                    set({ incomingRequests: [] });
                } catch (err) {
                    console.error('Accept Trip Error', err);
                }
            }
        }),
        {
            name: 'driver-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ isOnline: state.isOnline, metrics: state.metrics }),
        }
    )
);
