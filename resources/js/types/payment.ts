export type PaymentSetupResponseDto = {
    payment_id: number;
    client_secret: string;
    stripe_publishable_key: string | null;
};

export type PaymentSyncResponseDto = {
    ok: boolean;
    receipt_access_token: string;
    receipt_page_url: string;
};

export function paymentSetupSecretStorageKey(orderNumber: string): string {
    return `checkout_payment_setup:${orderNumber}`;
}
