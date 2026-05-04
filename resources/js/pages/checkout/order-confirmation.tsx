import { OrderSummary } from '@/components/sales/order-summary';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { StepIndicator } from '@/components/sales/step-indicator';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { CartItemDto } from '@/types/checkout';
import type { OrderDto } from '@/types/checkout';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

interface OrderConfirmationProps {
    order: OrderDto;
}

function orderLinesAsCartShapes(order: OrderDto): Pick<CartItemDto, 'quantity' | 'line_subtotal' | 'product' | 'variant'>[] {
    return order.items.map((i) => ({
        quantity: i.quantity,
        line_subtotal: i.line_subtotal,
        product: {
            id: i.product_id,
            name: i.product_name,
            slug: '',
            sku: i.sku,
            image_url: null,
        },
        variant:
            i.variant_name !== null && i.variant_name !== ''
                ? {
                      id: i.product_variant_id ?? 0,
                      name: i.variant_name,
                      sku: i.sku,
                  }
                : null,
    }));
}

export default function OrderConfirmation({ order }: OrderConfirmationProps) {
    const fauxItems = useMemo(() => orderLinesAsCartShapes(order), [order]);

    const meta = useMemo(
        () => ({
            subtotal: order.subtotal.toFixed(2),
            discount_total: order.discount_total.toFixed(2),
            taxable_subtotal: (order.subtotal - order.discount_total).toFixed(2),
            tax_rate: order.tax_rate_snapshot,
            tax_total: order.tax_total.toFixed(2),
            grand_total: order.grand_total.toFixed(2),
        }),
        [order],
    );

    return (
        <>
            <Head title={`Pedido ${order.order_number}`} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-5xl px-4 py-8">
                    <StepIndicator steps={['Carrito', 'Checkout', 'Pago', 'Recibo']} activeIndex={2} />
                    <div className="mb-10 rounded-xl border border-emerald-200 bg-emerald-50 px-8 py-10 dark:border-emerald-900/70 dark:bg-emerald-950/40">
                        <p className="text-emerald-800 text-sm font-semibold uppercase tracking-wide dark:text-emerald-200">Pedido recibido</p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight">¡Gracias!</h1>
                        <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
                            Tu pedido <strong className="text-foreground font-mono">{order.order_number}</strong> está en estado{' '}
                            <strong className="text-foreground">{order.status}</strong>.
                            {order.status === 'pendiente' ? (
                                <>
                                    {' '}
                                    Continúa en{' '}
                                    <Link className="text-foreground font-medium underline" href={route('checkout.payment', { order: order.order_number })}>
                                        la pantalla de pago
                                    </Link>{' '}
                                    (usa el mismo navegador que usaste al confirmar el checkout para conservar la clave temporal de cobro).
                                </>
                            ) : (
                                <>
                                    Contacto: <span className="text-foreground font-medium">{order.customer_email ?? 'tu correo'}</span>.
                                </>
                            )}
                        </p>
                        <p className="mt-6 text-xl font-semibold">
                            Total{' '}
                            {order.status === 'pendiente' ? 'pendiente ' : ''}
                            {formatMoney(order.grand_total)}
                        </p>
                    </div>

                    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                        <section>
                            <h2 className="mb-4 text-lg font-semibold">Detalle capturado</h2>
                            <ul className="divide-y rounded-xl border">
                                {order.items.map((i) => (
                                    <li key={i.id} className="flex justify-between px-4 py-3 text-sm">
                                        <div>
                                            <p className="font-medium">{i.product_name}</p>
                                            {i.variant_name ? <p className="text-muted-foreground text-xs">{i.variant_name}</p> : null}
                                            <p className="text-muted-foreground text-xs">SKU {i.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p>× {i.quantity}</p>
                                            <p className="font-semibold">{formatMoney(i.line_subtotal)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {order.status === 'pendiente' ? (
                                    <Button asChild>
                                        <Link href={route('checkout.payment', { order: order.order_number })}>Ir al pago</Link>
                                    </Button>
                                ) : (
                                    <Button asChild variant="outline">
                                        <Link href={route('orders.receipt', { order: order.order_number })}>Ver recibo</Link>
                                    </Button>
                                )}
                                <Button asChild>
                                    <Link href={route('catalog.index')}>Seguir navegando</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={route('cart.index')}>Mi carrito</Link>
                                </Button>
                            </div>
                        </section>
                        <OrderSummary items={fauxItems} meta={meta} caption="Totales conforme al snapshot del servidor" />
                    </div>
                </main>
            </div>
        </>
    );
}
