<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Payments\StripeWebhookProcessor;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Stripe\PaymentIntent;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    Storage::fake('local');
});

test('consolida un payment intent Stripe y marca el pedido como confirmado con recibo', function () {
    Http::fake();

    $plain = 'setup-secret-plain';

    $order = Order::create([
        'user_id' => User::factory()->create()->getKey(),
        'coupon_id' => null,
        'coupon_code_snapshot' => null,
        'order_number' => 'ORD-PAY-FINAL-1',
        'status' => OrderStatus::Pendiente,
        'customer_email' => 'buyer@example.com',
        'customer_name' => 'Buyer',
        'notes_customer' => null,
        'currency' => 'PEN',
        'tax_rate_snapshot' => '0.1800',
        'subtotal' => '50.00',
        'discount_total' => '0.00',
        'tax_total' => '9.00',
        'grand_total' => '59.00',
        'payment_setup_secret_hash' => Hash::make($plain),
        'receipt_access_token' => null,
        'receipt_path' => null,
    ]);

    Payment::create([
        'order_id' => $order->getKey(),
        'gateway' => PaymentGateway::Stripe,
        'external_id' => 'pi_test_finalize_1',
        'status' => PaymentStatus::Pending,
        'amount_minor' => StripeWebhookProcessor::minorAmountFromGrandTotal('59.00'),
        'currency' => 'PEN',
    ]);

    /** @phpstan-ignore-next-line */
    $intent = PaymentIntent::constructFrom([
        'id' => 'pi_test_finalize_1',
        'object' => 'payment_intent',
        'amount' => 5900,
        'currency' => 'pen',
        'metadata' => [
            'order_number' => $order->order_number,
        ],
    ]);

    $processor = app(StripeWebhookProcessor::class);

    $result = $processor->finalizeSucceededPaymentIntent($intent, 'evt_finalize_1', null);

    expect($result)->not->toBeNull()
        ->and($result['order_number'])->toBe('ORD-PAY-FINAL-1');

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Confirmado)
        ->and($order->receipt_access_token)->not->toBeNull()
        ->and($order->receipt_path)->not->toBeNull()
        ->and($order->payment_setup_secret_hash)->toBeNull();

    $again = $processor->finalizeSucceededPaymentIntent($intent, 'evt_finalize_2', null);

    expect($again['receipt_access_token'])->toBe($result['receipt_access_token']);
});

test('rechaza la consolidación cliente sin clave de setup válida', function () {
    Http::fake();

    $plain = 'setup-secret-plain';

    $order = Order::create([
        'user_id' => User::factory()->create()->getKey(),
        'coupon_id' => null,
        'coupon_code_snapshot' => null,
        'order_number' => 'ORD-PAY-FINAL-2',
        'status' => OrderStatus::Pendiente,
        'customer_email' => 'buyer@example.com',
        'customer_name' => 'Buyer',
        'notes_customer' => null,
        'currency' => 'PEN',
        'tax_rate_snapshot' => '0.1800',
        'subtotal' => '10.00',
        'discount_total' => '0.00',
        'tax_total' => '1.80',
        'grand_total' => '11.80',
        'payment_setup_secret_hash' => Hash::make($plain),
        'receipt_access_token' => null,
        'receipt_path' => null,
    ]);

    Payment::create([
        'order_id' => $order->getKey(),
        'gateway' => PaymentGateway::Stripe,
        'external_id' => 'pi_test_finalize_2',
        'status' => PaymentStatus::Pending,
        'amount_minor' => StripeWebhookProcessor::minorAmountFromGrandTotal('11.80'),
        'currency' => 'PEN',
    ]);

    /** @phpstan-ignore-next-line */
    $intent = PaymentIntent::constructFrom([
        'id' => 'pi_test_finalize_2',
        'object' => 'payment_intent',
        'amount' => 1180,
        'currency' => 'pen',
        'metadata' => [
            'order_number' => $order->order_number,
        ],
    ]);

    $processor = app(StripeWebhookProcessor::class);

    expect(fn () => $processor->finalizeSucceededPaymentIntent($intent, null, 'wrong-secret'))
        ->toThrow(HttpException::class);
});
