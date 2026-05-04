import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type {
    CustomerDto,
    CustomerListFilters,
    CustomerOrderSummaryDto,
    Paginated,
    SegmentDto,
} from '@/types/crm';
import { useQuery } from '@tanstack/react-query';

export const CRM_CUSTOMERS_KEY = ['crm', 'customers'] as const;

export function useCustomerList(filters: CustomerListFilters) {
    const {
        q,
        segment_id: segmentId,
        has_orders: hasOrders,
        date_from: dateFrom,
        date_to: dateTo,
        min_orders: minOrders,
        min_lifetime_total: minLifetimeTotal,
        page = 1,
        per_page: perPage = 15,
    } = filters;

    return useQuery({
        queryKey: [...CRM_CUSTOMERS_KEY, 'list', filters],
        queryFn: async (): Promise<Paginated<CustomerDto>> => {
            await ensureSanctumCsrfCookie();

            const { data } = await apiClient.get<Paginated<CustomerDto>>('/v1/customers', {
                params: {
                    q: q?.trim() ? q.trim() : undefined,
                    segment_id: segmentId,
                    has_orders: hasOrders === true ? 1 : hasOrders === false ? 0 : undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    min_orders: minOrders,
                    min_lifetime_total: minLifetimeTotal,
                    page,
                    per_page: perPage,
                },
            });

            return data;
        },
    });
}

export function useCustomerDetail(id: number | null) {
    return useQuery({
        queryKey: [...CRM_CUSTOMERS_KEY, 'detail', id],
        queryFn: async (): Promise<CustomerDto> => {
            await ensureSanctumCsrfCookie();
            const { data } = await apiClient.get<CustomerDto>(`/v1/customers/${id}`);

            return data;
        },
        enabled: id != null && id > 0,
    });
}

export function useCustomerOrders(customerId: number | null, page = 1, perPage = 10) {
    return useQuery({
        queryKey: [...CRM_CUSTOMERS_KEY, 'orders', customerId, page, perPage],
        queryFn: async (): Promise<Paginated<CustomerOrderSummaryDto>> => {
            await ensureSanctumCsrfCookie();
            const { data } = await apiClient.get<Paginated<CustomerOrderSummaryDto>>(
                `/v1/customers/${customerId}/orders`,
                { params: { page, per_page: perPage } },
            );

            return data;
        },
        enabled: customerId != null && customerId > 0,
    });
}

export function useSegments() {
    return useQuery({
        queryKey: ['crm', 'segments'],
        queryFn: async (): Promise<SegmentDto[]> => {
            await ensureSanctumCsrfCookie();
            const { data } = await apiClient.get<SegmentDto[] | { data: SegmentDto[] }>('/v1/segments');

            if (Array.isArray(data)) {
                return data;
            }

            return data.data;
        },
    });
}
