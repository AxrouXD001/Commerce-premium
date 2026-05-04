import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { StepIndicator } from '@/components/sales/step-indicator';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { CheckoutOrderBrief } from '@/types/checkout';
import { Head, Link } from '@inertiajs/react';

type OrderReceiptPageProps = {
    order: CheckoutOrderBrief;
    receipt_pdf_url: string | null;
};

export default function OrderReceiptPage({ order, receipt_pdf_url }: OrderReceiptPageProps) {
    return (
        <>
            <Head title={`Recibo ${order.order_number}`} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-3xl px-4 py-8">
                    <StepIndicator steps={['Carrito', 'Checkout', 'Pago', 'Recibo']} activeIndex={3} />
                    <header className="mb-10">
                        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Pago registrado</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Recibo · {order.order_number}</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Total {formatMoney(order.grand_total, 'es-PE', order.currency)} — estado{' '}
                            <span className="text-foreground">{order.status}</span>
                        </p>
                    </header>

                    {receipt_pdf_url ? (
                        <div className="space-y-4 rounded-xl border p-8">
                            <p className="text-sm">
                                Ya puedes descargar tu comprobante en PDF. También puede tomar un momento en reflejar el archivo si acabas de
                                completar el pago.
                            </p>
                            <Button asChild>
                                <a href={receipt_pdf_url}>Descargar PDF</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed px-8 py-10 text-sm">
                            <p className="text-muted-foreground">
                                No tienes permiso para ver este recibo, o el archivo aún se está generando. Si pagaste desde un enlace temporal,
                                revisa que la URL incluya el mismo parámetro <code className="text-foreground font-mono">token</code> que te dio el
                                flujo después del cobro.
                            </p>
                        </div>
                    )}

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('catalog.index')}>Seguir navegando</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('cart.index')}>Mi carrito</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
