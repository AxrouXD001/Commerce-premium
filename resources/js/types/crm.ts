export type CustomerStatus = 'active' | 'inactive';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export type SegmentKind = 'tag' | 'group';

export type SegmentDto = {
    id: number;
    name: string;
    slug: string;
    kind: SegmentKind;
    description: string | null;
};

export type CustomerAddressDto = {
    id: number;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postal_code: string | null;
    country: string;
    is_default: boolean;
    created_at: string | null;
    updated_at: string | null;
};

export type CustomerNoteDto = {
    id: number;
    body: string;
    author_user_id: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export type CustomerDto = {
    id: number;
    user_id: number | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    company: string | null;
    status: CustomerStatus;
    created_at: string | null;
    updated_at: string | null;
    segments?: SegmentDto[];
    addresses?: CustomerAddressDto[];
    notes?: CustomerNoteDto[];
    orders_count?: number;
    orders_sum_grand_total?: string | number | null;
};

export type CustomerOrderSummaryDto = {
    id: number;
    order_number: string;
    status: string;
    currency: string;
    grand_total: number;
    customer_email: string | null;
    customer_name: string | null;
    created_at: string | null;
};

export type LeadDto = {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    company: string | null;
    source: string;
    status: LeadStatus;
    message: string | null;
    converted_customer_id: number | null;
    assigned_user_id: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export type Paginated<T> = {
    data: T[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type CustomerListFilters = {
    q?: string;
    segment_id?: number;
    has_orders?: boolean;
    date_from?: string;
    date_to?: string;
    min_orders?: number;
    min_lifetime_total?: number;
    page?: number;
    per_page?: number;
};
