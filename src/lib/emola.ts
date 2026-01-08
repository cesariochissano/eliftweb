// import { supabase } from './supabase';

export interface EmolaPaymentResponse {
    transactionId: string;
    referenceId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

/**
 * Initiates an eMola C2B payment (Push USSD or Web Redirect).
 * 
 * @param phoneNumber Customer phone (2588xxxxxxx)
 * @param amount Amount in Meticais
 * @param reference Unique reference
 */
export const initiateEmolaPayment = async (
    phoneNumber: string,
    amount: number,
    reference: string
): Promise<EmolaPaymentResponse> => {

    // Validate Phone (Movitel prefixes: 86, 87)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    // Allow general 2588x for testing, but ideally enforce Movitel
    if (!cleanPhone.startsWith('258') || cleanPhone.length !== 12) {
        throw new Error('Número de telefone inválido. Use o formato 2588xxxxxxx');
    }

    console.log('[eMola] Initiating Payment:', { phoneNumber: cleanPhone, amount, reference });

    // TODO: Switch to Real Edge Function when deployed
    // const { data, error } = await supabase.functions.invoke('emola-pay', {
    //     body: { phoneNumber: cleanPhone, amount, reference }
    // });

    // Simulate "Test Environment" network call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                transactionId: `emola_tx_${Math.random().toString(36).substring(7)}`,
                referenceId: `ref_${Math.random().toString(36).substring(7)}`,
                status: 'SUCCESS'
            });
        }, 3000);
    });
};
