import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type UserRole = 'PASSENGER' | 'DRIVER' | 'FLEET_MANAGER' | 'SERVICE_ADMIN' | 'SUPER_ADMIN';

interface AuthState {
    user: any | null;
    profile: any | null;
    loading: boolean;
    initialized: boolean;

    // Actions
    fetchProfile: (userId: string) => Promise<void>;
    setUser: (user: any) => void;
    setLoading: (loading: boolean) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    fetchProfile: async (userId: string) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && profile) {
            set({ profile, loading: false, initialized: true });
        } else {
            set({ profile: null, loading: false, initialized: true });
        }
    },

    setUser: (user) => {
        set({ user });
        if (user) {
            get().fetchProfile(user.id);
        } else {
            set({ profile: null, loading: false, initialized: true });
        }
    },

    setLoading: (loading) => set({ loading }),

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, loading: false });
    }
}));
