import { apiClient } from '@/lib/api-client';
import type { CatalogSearchFilters, CatalogSearchResponse, ProductDto } from '@/types/catalog';
import { useQuery } from '@tanstack/react-query';

/**
 * Lista paginada vía REST clásico (sin servicio Node).
 */
export function useProducts(filters: CatalogSearchFilters) {
    const params = {
        ...filters,
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 12,
    };

    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const { data } = await apiClient.get<CatalogSearchResponse>('/v1/products', { params });

            return data;
        },
    });
}

export function useProduct(slug: string | undefined, options?: { initialData?: ProductDto }) {
    const initialData = options?.initialData;

    return useQuery({
        queryKey: ['product', slug],
        enabled: Boolean(slug),
        initialData,
        /** Sin caché larga: tras editar/subir imágenes el detalle debe volver a pedir el producto al API. */
        staleTime: 0,
        queryFn: async () => {
            const { data } = await apiClient.get<ProductDto>(`/v1/products/${slug}`);

            return data;
        },
    });
}
