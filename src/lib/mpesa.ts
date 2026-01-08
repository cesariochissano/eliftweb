// import { supabase } from './supabase';

export interface MpesaPaymentResponse {
    conversationId: string;
    transactionId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

/**
 * Initiates an M-Pesa C2B payment (Push USSD).
 * In a real environment, this must call a robust backend (Edge Function) to hide API Key.
 * 
 * @param phoneNumber Customer phone (25884xxxxxxx)
 * @param amount Amount in Meticais
 * @param reference Unique reference (e.g., DriverID)
 */
export const initiateMpesaPayment = async (
    phoneNumber: string,
    amount: number,
    reference: string
): Promise<MpesaPaymentResponse> => {

    // Validate Phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.startsWith('258') || cleanPhone.length !== 12) {
        throw new Error('Número de telefone inválido. Use o formato 25884xxxxxxx');
    }

    console.log('[M-Pesa] Initiating Payment:', { phoneNumber: cleanPhone, amount, reference });

    // TODO: Switch to Real Edge Function when deployed
    // const { data, error } = await supabase.functions.invoke('mpesa-pay', {
    //     body: { phoneNumber: cleanPhone, amount, reference }
    // });

    // For now, we simulate the "Test Environment" network call
    // This effectively "Replaces" the hardcoded logic in Earnings with a reusable service
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock Success Response from API
            resolve({
                conversationId: `conv_${Math.random().toString(36).substring(7)}`,
                transactionId: `tx_${Math.random().toString(36).substring(7)}`,
                status: 'SUCCESS' // In real C2B, it starts as PENDING until webhook
            });
        }, 3000);
    });
};
