import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { PaymentSetupResponseDto, PaymentSyncResponseDto } from '@/types/payment';

export async function setupStripePaymentIntent(orderNumber: string, paymentSetupSecret: string): Promise<PaymentSetupResponseDto> {
    await ensureSanctumCsrfCookie();

    const { data } = await apiClient.post<PaymentSetupResponseDto>('/v1/payments/setup', {
        order_number: orderNumber,
        payment_setup_secret: paymentSetupSecret,
    });

    return data;
}

export async function syncPaymentCompleted(payload: {
    paymentIntentId: string;
    paymentSetupSecret: string;
}): Promise<PaymentSyncResponseDto> {
    await ensureSanctumCsrfCookie();

    const { data } = await apiClient.post<PaymentSyncResponseDto>('/v1/payments/sync', {
        payment_intent_id: payload.paymentIntentId,
        payment_setup_secret: payload.paymentSetupSecret,
    });

    return data;
}
