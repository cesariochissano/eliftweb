import { supabase } from '../lib/supabase';
import type { Wallet, Transaction } from '../types/wallet';

export const WalletService = {
    /**
     * Get or Create Wallet for current user
     */
    async getMyWallet(): Promise<Wallet | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Try getting existing wallet
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;

        // If not exists, try creating (via RPC is safer but simple insert works if RLS allows or via RPC)
        // We have an RPC create_wallet_if_not_exists but we can also use insert if policy allows
        // Let's use the RPC we defined for safety
        if (!data) {
            const { error: rpcError } = await supabase.rpc('create_wallet_if_not_exists');
            if (rpcError) throw rpcError;

            // Fetch again
            const { data: newData, error: fetchError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) throw fetchError;
            return newData;
        }

        return data;
    },

    /**
     * Get recent transactions
     */
    async getTransactions(walletId: string, limit = 20): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * Simulate Top Up (M-Pesa)
     */
    async simulateTopUp(amount: number): Promise<boolean> {
        const { data, error } = await supabase.rpc('simulate_topup', { amount });

        if (error) {
            console.error('Topup Error:', error);
            return false;
        }
        return data?.success || false;
    },

    /**
     * Watch for Wallet Changes (Realtime)
     */
    subscribeToWallet(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('wallet-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
                callback
            )
            .subscribe();
    }
};
