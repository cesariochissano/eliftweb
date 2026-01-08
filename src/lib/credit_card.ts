// import { supabase } from './supabase';

export interface CardPaymentDetails {
    cardNumber: string;
    expiry: string;
    cvc: string;
    holderName: string;
}

export interface CardPaymentResponse {
    transactionId: string;
    authCode: string;
    status: 'SUCCESS' | 'FAILED' | 'REQUIRES_ACTION';
}

/**
 * Processes a Credit/Debit Card payment.
 * In production, NEVER handle raw card details on client if possible. 
 * Use Stripe Elements or equivalent. This mock accepts details for "Test Mode" simulation only.
 * 
 * @param cardDetails Basic Card Data
 * @param amount Amount in Meticais
 */
export const processCardPayment = async (
    cardDetails: CardPaymentDetails,
    amount: number
): Promise<CardPaymentResponse> => {

    console.log('[Credit Card] Processing Payment:', { amount, holder: cardDetails.holderName });

    // specific simulation: Trigger error for specific amount (e.g., 0)
    if (amount <= 0) throw new Error("Valor inválido.");

    // TODO: Call Secure Edge Function (that talks to Stripe/Punto/etc)

    // Simulate Network Delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                transactionId: `card_tx_${Math.random().toString(36).substring(7)}`,
                authCode: `AUTH${Math.floor(Math.random() * 100000)}`,
                status: 'SUCCESS'
            });
        }, 4000); // Cards usually take a bit longer
    });
};
