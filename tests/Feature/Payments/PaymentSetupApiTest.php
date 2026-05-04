<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('payments setup rejects invalid setup secret with validation errors', function () {
    $plain = 'correct-plain-secret';

    $order = Order::create([
        'user_id' => User::factory()->create()->getKey(),
        'coupon_id' => null,
        'coupon_code_snapshot' => null,
        'order_number' => 'ORD-SETUP-TEST-1',
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

    $response = $this->postJson('/api/v1/payments/setup', [
        'order_number' => $order->order_number,
        'payment_setup_secret' => 'wrong-plain-secret',
    ]);

    $response->assertStatus(422)->assertInvalid(['payment_setup_secret']);
});
