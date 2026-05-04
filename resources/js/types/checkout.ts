export type CartLineVariant = {
    id: number;
    name: string;
    sku: string;
};

export type CartLineProduct = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    image_url: string | null;
};

export type CartItemDto = {
    id: number;
    quantity: number;
    unit_price: number;
    line_subtotal: number;
    product: CartLineProduct | null;
    variant: CartLineVariant | null;
};

export type CartTotalsMeta = {
    subtotal: string;
    discount_total: string;
    taxable_subtotal: string;
    tax_rate: number;
    tax_total: string;
    grand_total: string;
};

export type CartDto = {
    id: number;
    coupon_code: string | null;
    items: CartItemDto[];
    meta?: CartTotalsMeta | null;
};

export type OrderLineDto = {
    id: number;
    product_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    sku: string;
    quantity: number;
    unit_price: number;
    line_subtotal: number;
};

export type OrderStatus =
    | 'pendiente'
    | 'confirmado'
    | 'en_proceso'
    | 'enviado'
    | 'entregado'
    | 'cancelado';

export type OrderDto = {
    id: number;
    order_number: string;
    status: OrderStatus;
    currency: string;
    tax_rate_snapshot: number;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    grand_total: number;
    customer_email: string | null;
    customer_name: string | null;
    notes_customer: string | null;
    coupon_code_snapshot: string | null;
    created_at: string | null;
    items: OrderLineDto[];
};

/** Respuesta de POST /v1/orders (OrderResource + payment_setup_secret). */
export type CheckoutOrderPayload = OrderDto & { payment_setup_secret: string };

/** Props mínimas para la página de cobro con Stripe. */
export type CheckoutOrderBrief = Pick<OrderDto, 'order_number' | 'grand_total' | 'currency' | 'status'>;
