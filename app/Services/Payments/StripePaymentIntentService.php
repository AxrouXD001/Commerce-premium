<?php

namespace App\Services\Payments;

use App\Enums\OrderStatus;
use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\LazyCollection;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class StripePaymentIntentService
{
    public function __construct()
    {
        Stripe::setApiKey((string) config('services.stripe.secret'));
    }

    /**
     * Cancela intents pendientes anteriores y crea uno nuevo para el SPA (Stripe Elements).
     *
     * @return array{payment: Payment, client_secret: string}
     */
    public function beginForOrder(Order $order, string $setupPlain): array
    {
        if ($order->status !== OrderStatus::Pendiente) {
            throw ValidationException::withMessages([
                'order' => 'Este pedido no admite un nuevo cobro.',
            ]);
        }

        if (! $order->validPaymentSetup($setupPlain)) {
            throw ValidationException::withMessages([
                'payment_setup_secret' => 'La clave de pago es inválida o el pedido ya no está pendiente.',
            ]);
        }

        if (trim((string) config('services.stripe.secret')) === '') {
            throw ValidationException::withMessages([
                'stripe' => 'Falta STRIPE_SECRET en el servidor.',
            ]);
        }

        $minorExpected = StripeWebhookProcessor::minorAmountFromGrandTotal((string) $order->grand_total);
        $currency = strtolower((string) $order->currency);

        try {
            return DB::transaction(function () use ($order, $minorExpected, $currency): array {
                /** @var LazyCollection<int, Payment> $stale */
                $stale = $order->payments()->where('status', PaymentStatus::Pending)->cursor();

                foreach ($stale as $oldPayment) {
                    try {
                        $existingIntent = PaymentIntent::retrieve((string) $oldPayment->external_id);
                        if (! in_array($existingIntent->status, ['succeeded', 'canceled'], true)) {
                            $existingIntent->cancel();
                        }
                    } catch (ApiErrorException $e) {
                        Log::warning('stripe.payment_intent.cancel_failed', [
                            'payment_id' => $oldPayment->getKey(),
                            'stripe_message' => $e->getMessage(),
                        ]);
                    } catch (\Throwable) {
                        //
                    }

                    $oldPayment->forceFill([
                        'status' => PaymentStatus::Failed,
                        'failure_message' => 'Reemplazado por un nuevo intento de cobro.',
                    ])->save();
                }

                $stripeIntent = PaymentIntent::create([
                    'amount' => $minorExpected,
                    'currency' => $currency,
                    'automatic_payment_methods' => ['enabled' => true],
                    'metadata' => [
                        'order_id' => (string) $order->getKey(),
                        'order_number' => $order->order_number,
                    ],
                ]);

                /** @phpstan-ignore-next-line */
                $clientSecret = $stripeIntent->client_secret;
                if (! is_string($clientSecret)) {
                    throw ValidationException::withMessages([
                        'stripe' => 'Stripe no devolvió client_secret.',
                    ]);
                }

                /** @var Payment $payment */
                $payment = $order->payments()->create([
                    'gateway' => PaymentGateway::Stripe,
                    'external_id' => (string) $stripeIntent->id,
                    'status' => PaymentStatus::Pending,
                    'amount_minor' => $minorExpected,
                    'currency' => strtoupper($currency),
                ]);

                return [
                    'payment' => $payment,
                    'client_secret' => $clientSecret,
                ];
            });
        } catch (ApiErrorException $e) {
            Log::warning('stripe.payment_intent.create_failed', [
                'order_id' => $order->getKey(),
                'stripe_code' => $e->getStripeCode(),
                'stripe_message' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'stripe' => 'No pudimos iniciar el cobro con Stripe. Revisa STRIPE_SECRET / STRIPE_KEY en el servidor y que las claves correspondan al mismo modo (prueba vs producción).',
            ]);
        }
    }
}
