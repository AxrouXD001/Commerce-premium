import { OrderSummary } from '@/components/sales/order-summary';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { StepIndicator } from '@/components/sales/step-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import type { CheckoutPayload } from '@/hooks/use-checkout';
import { useCheckout } from '@/hooks/use-checkout';
import type { SharedData } from '@/types/index';
import { paymentSetupSecretStorageKey } from '@/types/payment';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';

export default function CheckoutPage() {
    const { auth } = usePage<SharedData>().props;
    const { cart } = useCart();
    const checkout = useCheckout();

    const items = cart?.items ?? [];
    const meta = cart?.meta;

    const [customerEmail, setCustomerEmail] = useState(auth.user?.email ?? '');
    const [customerName, setCustomerName] = useState(auth.user?.name ?? '');
    const [notes, setNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

    const canSubmit = useMemo(() => items.length > 0, [items.length]);

    async function submit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setFieldErrors(null);

        if (!canSubmit || checkout.isPending) {
            return;
        }

        const payload: CheckoutPayload = {
            customer_email: customerEmail.trim() || null,
            customer_name: customerName.trim() || null,
            notes_customer: notes.trim() ? notes.trim() : null,
        };

        checkout.mutate(payload, {
            onSuccess(order) {
                if (order.payment_setup_secret) {
                    sessionStorage.setItem(paymentSetupSecretStorageKey(order.order_number), order.payment_setup_secret);
                }

                router.visit(route('checkout.payment', order.order_number));
            },
            onError(err) {
                if (isAxiosError(err)) {
                    const bag = err.response?.data?.errors as Record<string, string[]> | undefined;
                    if (bag) {
                        const flat: Record<string, string> = {};
                        Object.keys(bag).forEach((k) => {
                            flat[k] = bag[k]?.[0] ?? '';
                        });
                        setFieldErrors(flat);
                    }
                }
            },
        });
    }

    return (
        <>
            <Head title="Checkout" />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-5xl px-4 py-8">
                    <StepIndicator steps={['Carrito', 'Checkout', 'Pago', 'Recibo']} activeIndex={1} />
                    <header className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Confirma tu pedido pendiente; después irás a pagar con Stripe (tarjeta).
                        </p>
                    </header>

                    {!canSubmit ? (
                        <div className="rounded-xl border border-dashed px-8 py-12 text-center text-sm">
                            <p>Tu carrito está vacío.</p>
                            <Button asChild className="mt-4" variant="outline">
                                <Link href={route('catalog.index')}>Ir al catálogo</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                            <section>
                                <form className="space-y-6" onSubmit={(e) => void submit(e)}>
                                    <fieldset className="space-y-3">
                                        <legend className="mb-3 text-lg font-semibold">Datos del pedido</legend>
                                        {auth.user === null ? (
                                            <div className="space-y-1">
                                                <Label htmlFor="email">Correo</Label>
                                                <Input id="email" type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                                                {fieldErrors?.customer_email ? <p className="text-destructive text-xs">{fieldErrors.customer_email}</p> : null}
                                                <p className="text-muted-foreground text-xs">Necesario para confirmar tu pedido.</p>
                                            </div>
                                        ) : null}
                                        <div className="space-y-1">
                                            <Label htmlFor="name">Nombre (opcional)</Label>
                                            <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                            {fieldErrors?.customer_name ? <p className="text-destructive text-xs">{fieldErrors.customer_name}</p> : null}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="notes">Notas (opcional)</Label>
                                            <textarea
                                                id="notes"
                                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring ring-offset-background flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </fieldset>

                                    {fieldErrors?.cart ? <p className="text-destructive text-sm">{fieldErrors.cart}</p> : null}
                                    {fieldErrors?.coupon ? <p className="text-destructive text-sm">{fieldErrors.coupon}</p> : null}

                                    <div className="flex gap-3">
                                        <Button asChild variant="outline" type="button">
                                            <Link href={route('cart.index')}>← Volver al carrito</Link>
                                        </Button>
                                        <Button type="submit" disabled={checkout.isPending}>
                                            {checkout.isPending ? 'Procesando...' : 'Confirmar pedido'}
                                        </Button>
                                    </div>
                                </form>
                            </section>
                            <OrderSummary items={items} meta={meta} caption="Total estimado incluye IGV configurado (.env)." />
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
