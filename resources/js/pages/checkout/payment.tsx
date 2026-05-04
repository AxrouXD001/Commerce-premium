import { PaymentForm } from '@/components/payments/payment-form';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { StepIndicator } from '@/components/sales/step-indicator';
import { Button } from '@/components/ui/button';
import { setupStripePaymentIntent } from '@/hooks/use-payment';
import { formatMoney } from '@/lib/money';
import type { CheckoutOrderBrief } from '@/types/checkout';
import { paymentSetupSecretStorageKey } from '@/types/payment';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type StripeElementsOptions } from '@stripe/stripe-js';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type CheckoutPaymentPageProps = {
    order: CheckoutOrderBrief;
};

const stripeAppearance: Appearance = {
    theme: 'stripe',
    variables: {
        borderRadius: '8px',
    },
};

export default function CheckoutPaymentPage({ order }: CheckoutPaymentPageProps) {
    const storageKey = useMemo(() => paymentSetupSecretStorageKey(order.order_number), [order.order_number]);
    const [setupSecret] = useState<string | null>(() =>
        typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null,
    );
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [publishableKey, setPublishableKey] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadingSetup, setLoadingSetup] = useState(true);

    const stripePromise = useMemo(() => {
        if (!publishableKey) {
            return null;
        }

        return loadStripe(publishableKey);
    }, [publishableKey]);

    useEffect(() => {
        let cancelled = false;

        async function run(): Promise<void> {
            if (!setupSecret) {
                setLoadError(
                    'No encontramos tu clave temporal de cobro (expira cuando cierras el navegador). Vuelve a confirmar el pedido en checkout.',
                );
                setLoadingSetup(false);

                return;
            }

            try {
                const dto = await setupStripePaymentIntent(order.order_number, setupSecret);

                if (cancelled) {
                    return;
                }

                const pub = dto.stripe_publishable_key?.trim() ?? '';

                if (pub === '' || dto.client_secret.trim() === '') {
                    setLoadError('Stripe no está configurado en el servidor (STRIPE_KEY / STRIPE_SECRET).');

                    return;
                }

                setPublishableKey(pub);
                setClientSecret(dto.client_secret.trim());
            } catch {
                if (!cancelled) {
                    setLoadError(
                        'No pudimos inicializar Stripe para este pedido. Comprueba que el número de pedido coincide y que sigue pendiente.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingSetup(false);
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
        };
    }, [order.order_number, setupSecret]);

    const elementsOptions: StripeElementsOptions | null =
        clientSecret !== null
            ? {
                  clientSecret,
                  appearance: stripeAppearance,
              }
            : null;

    return (
        <>
            <Head title={`Pago ${order.order_number}`} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-3xl px-4 py-8">
                    <StepIndicator steps={['Carrito', 'Checkout', 'Pago', 'Recibo']} activeIndex={2} />
                    <header className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight">Pago con tarjeta</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Pedido <span className="text-foreground font-mono">{order.order_number}</span> — total{' '}
                            <span className="text-foreground font-semibold">{formatMoney(order.grand_total, 'es-PE', order.currency)}</span>{' '}
                            — estado{' '}
                            <span className="text-foreground">{order.status}</span>
                        </p>
                    </header>

                    {loadingSetup ? (
                        <p className="text-muted-foreground text-sm">Preparando formulario seguro…</p>
                    ) : loadError ? (
                        <div className="space-y-4 rounded-xl border border-dashed px-6 py-8">
                            <p className="text-destructive text-sm">{loadError}</p>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild variant="outline">
                                    <Link href={route('checkout.index')}>Volver al checkout</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={route('orders.confirmation', order.order_number)}>Ver resumen del pedido</Link>
                                </Button>
                            </div>
                        </div>
                    ) : stripePromise && elementsOptions && setupSecret ? (
                        <div className="rounded-xl border p-6">
                            <Elements options={elementsOptions} stripe={stripePromise}>
                                <PaymentForm orderNumber={order.order_number} setupSecret={setupSecret} />
                            </Elements>
                            <p className="text-muted-foreground mt-6 text-xs">Pagos procesados de forma segura con Stripe.</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Sin datos de cliente Stripe.</p>
                    )}
                </main>
            </div>
        </>
    );
}
