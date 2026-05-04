import type { CheckoutOrderPayload } from '@/types/checkout';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import { SALES_CART_QUERY_KEY } from '@/http/sales-cart-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type CheckoutPayload = {
    customer_email?: string | null;
    customer_name?: string | null;
    notes_customer?: string | null;
};

export function useCheckout() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CheckoutPayload) => {
            await ensureSanctumCsrfCookie();

            const { data } = await apiClient.post<CheckoutOrderPayload>('/v1/orders', payload);

            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: SALES_CART_QUERY_KEY }).catch(() => undefined),
    });
}
