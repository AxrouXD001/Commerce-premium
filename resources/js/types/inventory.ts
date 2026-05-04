export type InventoryLineDto = {
    id: number;
    warehouse_id: number;
    product_id: number;
    product_variant_key: number;
    product_name?: string;
    sku: string;
    on_hand: number;
    reserved: number;
    available: number;
    reorder_point: number;
};

export type InventoryPaginatedResponse = {
    data: InventoryLineDto[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};
