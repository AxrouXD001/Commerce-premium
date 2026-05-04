export interface CategoryDto {
    id: number;
    name: string;
    slug?: string;
    active_products_count?: number | null;
}

export interface ProductVariantDto {
    id: number;
    name: string;
    sku: string;
    price_adjustment: number;
    stock: number;
    position?: number;
}

export interface ProductImageDto {
    id?: number;
    url: string;
    alt_text?: string | null;
    sort_order?: number;
}

export interface ProductDto {
    id: number;
    category_id: number | null;
    name: string;
    slug: string;
    sku: string;
    description?: string | null;
    price: number;
    compare_at_price?: number | null;
    stock: number;
    is_active?: boolean;
    category?: CategoryDto | null;
    images: ProductImageDto[];
    variants: ProductVariantDto[];
}

export interface PriceRange {
    min: number;
    max: number;
}

export interface CatalogSearchFilters {
    q?: string;
    category_id?: number;
    min_price?: string;
    max_price?: string;
    sort?: string;
    page?: number;
    per_page?: number;
}

export interface PaginationMetaDto {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

export interface CatalogSearchResponse {
    data: ProductDto[];
    meta?: PaginationMetaDto;
    facets?: {
        categories: CategoryDto[];
    };
}
