import { apiClient } from '@/lib/api-client';
import type { CatalogSearchFilters, CatalogSearchResponse } from '@/types/catalog';
import { useQuery } from '@tanstack/react-query';

export function useCatalogSearch(filters: CatalogSearchFilters) {
    const params = {
        ...filters,
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 12,
    };

    return useQuery({
        queryKey: ['catalog-search', params],
        queryFn: async () => {
            const { data } = await apiClient.get<CatalogSearchResponse>('/v1/products/search', { params });

            return data;
        },
    });
}
