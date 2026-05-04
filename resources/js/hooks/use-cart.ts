import type { CartDto } from '@/types/checkout';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import { SALES_CART_QUERY_KEY } from '@/http/sales-cart-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCart() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: SALES_CART_QUERY_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<CartDto>('/v1/cart');

            return data;
        },
    });

    async function prefetchCsrfThen<T>(runner: () => Promise<T>): Promise<T> {
        await ensureSanctumCsrfCookie();

        return runner();
    }

    function invalidateSalesCart(): void {
        queryClient.invalidateQueries({ queryKey: SALES_CART_QUERY_KEY }).catch(() => undefined);
    }

    const addToCartMutation = useMutation({
        mutationFn: async (body: { product_id: number; product_variant_id?: number | null; quantity: number }) =>
            prefetchCsrfThen(async () => {
                const { data } = await apiClient.post<CartDto>('/v1/cart/add', body);

                return data;
            }),
        onSuccess: () => invalidateSalesCart(),
    });

    const updateQtyMutation = useMutation({
        mutationFn: async (body: { cart_item_id: number; quantity: number }) =>
            prefetchCsrfThen(async () => {
                const { data } = await apiClient.put<CartDto>('/v1/cart/update', body);

                return data;
            }),
        onSuccess: () => invalidateSalesCart(),
    });

    const removeMutation = useMutation({
        mutationFn: async (body: { cart_item_id: number }) =>
            prefetchCsrfThen(async () => {
                const { data } = await apiClient.delete<CartDto>('/v1/cart/remove', {
                    data: body,
                });

                return data;
            }),
        onSuccess: () => invalidateSalesCart(),
    });

    const applyCouponMutation = useMutation({
        mutationFn: async (body: { code: string }) =>
            prefetchCsrfThen(async () => {
                const { data } = await apiClient.post<CartDto>('/v1/cart/coupon', body);

                return data;
            }),
        onSuccess: () => invalidateSalesCart(),
    });

    const removeCouponMutation = useMutation({
        mutationFn: async () =>
            prefetchCsrfThen(async () => {
                const { data } = await apiClient.delete<CartDto>('/v1/cart/coupon');

                return data;
            }),
        onSuccess: () => invalidateSalesCart(),
    });

    type AddArgs = { product_id: number; product_variant_id?: number | null; quantity: number };

    return {
        cart: query.data,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        invalidate: invalidateSalesCart,
        addToCart: (args: AddArgs) => addToCartMutation.mutateAsync(args),
        updateQuantity: (cart_item_id: number, quantity: number) => updateQtyMutation.mutateAsync({ cart_item_id, quantity }),
        removeItem: (cart_item_id: number) => removeMutation.mutateAsync({ cart_item_id }),
        applyCoupon: (code: string) => applyCouponMutation.mutateAsync({ code }),
        removeCoupon: () => removeCouponMutation.mutateAsync(),
        mutationPending:
            addToCartMutation.isPending ||
            updateQtyMutation.isPending ||
            removeMutation.isPending ||
            applyCouponMutation.isPending ||
            removeCouponMutation.isPending,
    };
}
