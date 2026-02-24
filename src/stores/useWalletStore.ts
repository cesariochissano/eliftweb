import { create } from 'zustand';
import { WalletService } from '../services/wallet.service';
import type { Wallet, Transaction } from '../types/wallet';

interface WalletStore {
    wallet: Wallet | null;
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;

    fetchWallet: () => Promise<void>;
    fetchTransactions: () => Promise<void>;
    topUp: (amount: number) => Promise<boolean>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
    wallet: null,
    transactions: [],
    isLoading: false,
    error: null,

    fetchWallet: async () => {
        set({ isLoading: true, error: null });
        try {
            const wallet = await WalletService.getMyWallet();
            set({ wallet, isLoading: false });

            // If we got a wallet, also fetch transactions
            if (wallet) {
                get().fetchTransactions();
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchTransactions: async () => {
        const { wallet } = get();
        if (!wallet) return;

        try {
            const transactions = await WalletService.getTransactions(wallet.id);
            set({ transactions });
        } catch (err: any) {
            console.error('Failed to fetch transactions', err);
        }
    },

    topUp: async (amount: number) => {
        set({ isLoading: true });
        try {
            const success = await WalletService.simulateTopUp(amount);
            if (success) {
                await get().fetchWallet(); // Refresh balance
            }
            set({ isLoading: false });
            return success;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    }
}));
