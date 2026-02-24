import { supabase } from '../lib/supabase';
// import { TripDetails } from '../stores/useTripStore'; // Removed circular dependency, unused.

export const TripService = {
    // Criar Viagem
    async createTrip(tripData: any): Promise<any> {
        const { data, error } = await supabase
            .from('trips')
            .insert(tripData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Cancelar Viagem
    async cancelTrip(tripId: string, reason: string, version: number): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .update({
                status: 'CANCELLED',
                cancellation_reason: reason,
                trip_version: version
            })
            .eq('id', tripId);

        if (error) throw error;
    },

    // Obter Viagem Ativa
    async getActiveTrip(userId: string, role: 'PASSENGER' | 'DRIVER'): Promise<any> {
        const query = supabase.from('trips').select('*');

        if (role === 'DRIVER') {
            query.eq('driver_id', userId).neq('status', 'COMPLETED').neq('status', 'CANCELLED');
        } else {
            query.eq('passenger_id', userId).neq('status', 'COMPLETED').neq('status', 'CANCELLED');
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

        if (error) throw error;
        return data;
    },

    // Aceitar Viagem
    async acceptTrip(tripId: string, driverId: string, version: number): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .update({
                status: 'ACCEPTED',
                driver_id: driverId,
                trip_version: version
            })
            .eq('id', tripId);

        if (error) throw error;
    },

    // Chegar ao Ponto de Recolha
    async arriveAtPickup(tripId: string, version: number): Promise<void> {
        // Tenta atualizar com versão primeiro
        let { error } = await supabase.from('trips')
            .update({ status: 'ARRIVED', trip_version: version })
            .eq('id', tripId);

        // Fallback se coluna version não existir (resiliência)
        if (error && error.code === 'PGRST204') {
            const fallback = await supabase.from('trips')
                .update({ status: 'ARRIVED' })
                .eq('id', tripId);
            error = fallback.error;
        }

        if (error) throw error;
    },

    // Iniciar Viagem
    async startTrip(tripId: string, version: number): Promise<void> {
        let { error } = await supabase.from('trips')
            .update({ status: 'IN_PROGRESS', trip_version: version })
            .eq('id', tripId);

        if (error && error.code === 'PGRST204') {
            const fallback = await supabase.from('trips')
                .update({ status: 'IN_PROGRESS' })
                .eq('id', tripId);
            error = fallback.error;
        }

        if (error) throw error;
    },

    // Completar Viagem
    async completeTrip(tripId: string, version: number): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .update({ status: 'COMPLETED', trip_version: version })
            .eq('id', tripId);

        if (error) throw error;
    }
};
