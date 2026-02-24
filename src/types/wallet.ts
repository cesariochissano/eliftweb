export type TransactionType = 'TRIP_PAYMENT' | 'TOPUP' | 'WITHDRAWAL' | 'COMMISSION_DEDUCTION' | 'REFUND';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    status: 'active' | 'frozen';
    updated_at: string;
}

export interface Transaction {
    id: string;
    wallet_id: string;
    amount: number;
    type: TransactionType;
    reference_id?: string;
    description?: string;
    status: TransactionStatus;
    created_at: string;
}
