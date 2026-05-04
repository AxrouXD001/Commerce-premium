<?php

namespace App\Services\Payments;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Inventory\InventoryLedgerService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Stripe\Event;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class StripeWebhookProcessor
{
    public function __construct(
        private PaymentReceiptPdfService $receiptPdf,
        private NotifyPaymentCompletedService $notifyPaymentCompleted,
        private InventoryLedgerService $inventoryLedger,
    ) {}

    public function handle(Event $event): void
    {
        Stripe::setApiKey((string) config('services.stripe.secret'));

        match ($event->type) {
            'payment_intent.succeeded' => $this->paymentIntentSucceeded($event),
            'payment_intent.payment_failed' => $this->paymentIntentFailed($event),
            default => null,
        };
    }

    public static function minorAmountFromGrandTotal(string $grandTotal): int
    {
        return (int) round((float) $grandTotal * 100);
    }

    /**
     * Consolidación idempotente: webhook Stripe o llamada cliente tras Elements (confirmPayment).
     *
     * @param  string|null  $stripeEventId  Null cuando el origen es el cliente tras confirmación on-session.
     * @return array{receipt_access_token: string, order_number: string}|null Sin Payment interno alineado al intent.
     */
    public function finalizeSucceededPaymentIntent(PaymentIntent $intent, ?string $stripeEventId, ?string $callerSetupPlain): ?array
    {
        Stripe::setApiKey((string) config('services.stripe.secret'));

        $intentId = (string) $intent->id;
        $amountMinorStripe = (int) $intent->amount;
        /** @phpstan-ignore-next-line */
        $currencyStripe = strtolower((string) $intent->currency);

        $outcome = DB::transaction(function () use ($intent, $stripeEventId, $callerSetupPlain, $intentId, $amountMinorStripe, $currencyStripe): ?array {
            /** @var Payment|null $payment */
            $payment = Payment::query()->where('external_id', $intentId)->lockForUpdate()->first();

            if ($payment === null) {
                Log::warning('Stripe: PaymentIntent sin registro interno.', ['intent' => $intentId]);

                return null;
            }

            if ($payment->status === PaymentStatus::Completed) {
                /** @var Order|null $existingOrder */
                $existingOrder = Order::query()->whereKey($payment->order_id)->lockForUpdate()->first();
                if ($existingOrder === null || $existingOrder->receipt_access_token === null) {
                    Log::critical('Stripe: pago completado sin token de recibo.', ['intent' => $intentId]);

                    return null;
                }

                return [
                    'kind' => 'cached',
                    'receipt_access_token' => (string) $existingOrder->receipt_access_token,
                    'order_number' => (string) $existingOrder->order_number,
                ];
            }

            /** @var Order $order */
            $order = Order::query()->whereKey($payment->order_id)->lockForUpdate()->firstOrFail();

            if ($stripeEventId === null) {
                if ($callerSetupPlain === null || $callerSetupPlain === '' || ! $order->validPaymentSetup($callerSetupPlain)) {
                    abort(403, 'Credencial de cobro inválida.');
                }
            }

            $expectedMinor = self::minorAmountFromGrandTotal((string) $order->grand_total);
            if ($amountMinorStripe !== $expectedMinor || strtolower((string) $order->currency) !== $currencyStripe) {
                Log::critical('Stripe: discrepancia moneda/importe', [
                    'order' => $order->order_number,
                    'stripe_minor' => $amountMinorStripe,
                    'expected_minor' => $expectedMinor,
                    'stripe_currency' => $currencyStripe,
                    'order_currency' => $order->currency,
                ]);

                abort(422, 'Importe Stripe no coincide con el pedido.');
            }

            $metaOrder = data_get($intent->metadata, 'order_number');
            if ($metaOrder !== null && (string) $metaOrder !== (string) $order->order_number) {
                Log::critical('Stripe: metadata order_number inconsistente.', [
                    'order' => $order->order_number,
                    'metadata' => (string) $metaOrder,
                ]);

                abort(422, 'Intención de pago inconsistente.');
            }

            $eventLabel = $stripeEventId ?? 'client_confirm';

            $payment->forceFill([
                'status' => PaymentStatus::Completed,
                'failure_message' => null,
                'stripe_last_event_id' => $eventLabel,
            ])->save();

            $token = Str::random(48);
            $order->forceFill([
                'status' => OrderStatus::Confirmado,
                'payment_setup_secret_hash' => null,
                'receipt_access_token' => $token,
            ])->save();

            $this->inventoryLedger->commitPaidOrder($order->load('items'));

            return [
                'kind' => 'fresh',
                'receipt_access_token' => $token,
                'order_number' => (string) $order->order_number,
                'order_id' => (int) $order->getKey(),
                'payment_id' => (int) $payment->getKey(),
            ];
        });

        if ($outcome === null) {
            return null;
        }

        if (($outcome['kind'] ?? '') === 'fresh') {
            /** @var Order $orderForReceipt */
            $orderForReceipt = Order::query()->findOrFail($outcome['order_id']);
            /** @var Payment $paymentForReceipt */
            $paymentForReceipt = Payment::query()->findOrFail($outcome['payment_id']);

            try {
                $relativePdf = $this->receiptPdf->generate($orderForReceipt->fresh(['items']), $paymentForReceipt->fresh());
                $orderForReceipt->forceFill([
                    'receipt_path' => $relativePdf,
                ])->save();
            } catch (\Throwable $e) {
                Log::error('Stripe: fallo al generar PDF de recibo tras cobro confirmado.', [
                    'order_number' => $outcome['order_number'],
                    'exception' => $e,
                ]);
            }

            try {
                $this->notifyPaymentCompleted->ping($orderForReceipt->fresh(['items']), $paymentForReceipt->fresh());
            } catch (\Throwable $e) {
                Log::warning('Stripe: fallo en notificación post-pago.', [
                    'order_number' => $outcome['order_number'],
                    'exception' => $e,
                ]);
            }
        }

        return [
            'receipt_access_token' => $outcome['receipt_access_token'],
            'order_number' => $outcome['order_number'],
        ];
    }

    protected function paymentIntentSucceeded(Event $event): void
    {
        /** @var PaymentIntent $intent */
        $intent = $event->data->object;

        $this->finalizeSucceededPaymentIntent($intent, $event->id, null);
    }

    protected function paymentIntentFailed(Event $event): void
    {
        /** @var PaymentIntent $intent */
        $intent = $event->data->object;
        $intentId = (string) $intent->id;

        $lm = $intent->last_payment_error ?? null;
        $message = (is_object($lm) && isset($lm->message) && is_string($lm->message))
            ? $lm->message
            : 'Pago rechazado.';

        DB::transaction(function () use ($intentId, $message, $event): void {
            $payment = Payment::query()->where('external_id', $intentId)->lockForUpdate()->first();

            if ($payment === null) {
                return;
            }

            if ($payment->status === PaymentStatus::Completed) {
                return;
            }

            $payment->forceFill([
                'status' => PaymentStatus::Failed,
                'failure_message' => $message,
                'stripe_last_event_id' => $event->id,
            ])->save();
        });
    }
}
