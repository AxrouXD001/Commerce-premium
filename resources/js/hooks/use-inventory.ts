import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { InventoryPaginatedResponse } from '@/types/inventory';
import { useQuery } from '@tanstack/react-query';

export const INVENTORY_QUERY_KEY = ['inventory'] as const;

export function useInventoryList(params: { warehouseId?: number; q?: string; page?: number; perPage?: number }) {
    const { warehouseId, q, page = 1, perPage = 25 } = params;

    return useQuery({
        queryKey: [...INVENTORY_QUERY_KEY, warehouseId ?? 'default', q ?? '', page, perPage],
        queryFn: async (): Promise<InventoryPaginatedResponse> => {
            await ensureSanctumCsrfCookie();

            const { data } = await apiClient.get<InventoryPaginatedResponse>('/v1/inventory', {
                params: {
                    warehouse_id: warehouseId,
                    q: q?.trim() ? q.trim() : undefined,
                    page,
                    per_page: perPage,
                },
            });

            return data;
        },
    });
}
