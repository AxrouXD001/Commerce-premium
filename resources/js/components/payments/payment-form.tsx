import { Button } from '@/components/ui/button';
import { syncPaymentCompleted } from '@/hooks/use-payment';
import { paymentSetupSecretStorageKey } from '@/types/payment';
import type { StripeError } from '@stripe/stripe-js';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { router } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { useState } from 'react';

type Props = {
    orderNumber: string;
    setupSecret: string;
};

export function PaymentForm({ orderNumber, setupSecret }: Props) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    async function submit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setMessage(null);

        if (!stripe || !elements) {
            setMessage('Stripe aún está cargando. Espera un momento e inténtalo de nuevo.');

            return;
        }

        setSubmitting(true);

        const { error, paymentIntent }: { error?: StripeError; paymentIntent?: { id: string; status?: string } | null } =
            await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: {
                    return_url: window.location.href,
                },
            });

        if (error) {
            setMessage(error.message ?? 'El pago no pudo procesarse.');
            setSubmitting(false);

            return;
        }

        if (!paymentIntent || paymentIntent.status !== 'succeeded') {
            setMessage('El estado del pago en Stripe sigue pendiente o requiere otra acción.');
            setSubmitting(false);

            return;
        }

        try {
            const sync = await syncPaymentCompleted({
                paymentIntentId: paymentIntent.id,
                paymentSetupSecret: setupSecret,
            });
            sessionStorage.removeItem(paymentSetupSecretStorageKey(orderNumber));
            router.visit(sync.receipt_page_url);
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = typeof err.response?.data === 'object' && err.response.data !== null && 'message' in err.response.data
                    ? String((err.response.data as { message?: string }).message ?? '')
                    : '';

                setMessage(msg || 'Stripe confirmó el cobro pero el servidor rechazó la sincronización.');
            } else {
                setMessage('Stripe confirmó el cobro pero no pudimos registrarlo en la tienda. Contacta soporte.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="space-y-6" onSubmit={(ev) => void submit(ev)}>
            <PaymentElement />
            {message ? <p className="text-destructive text-sm">{message}</p> : null}
            <Button className="w-full sm:w-auto" disabled={submitting || !stripe} type="submit">
                {submitting ? 'Procesando…' : 'Pagar'}
            </Button>
        </form>
    );
}
