<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotifyPaymentCompletedService
{
    public function ping(Order $order, Payment $payment): void
    {
        $url = config('services.payments.notify_url');
        $token = config('services.payments.notify_token');

        if (! is_string($url) || $url === '') {
            return;
        }

        try {
            $response = Http::timeout(15)
                ->withToken(is_string($token) ? $token : '')
                ->acceptJson()
                ->post($url, [
                    'event' => 'payment_completed',
                    'order_number' => $order->order_number,
                    'order_id' => $order->getKey(),
                    'payment_id' => $payment->getKey(),
                    'external_id' => $payment->external_id,
                    'amount_minor' => $payment->amount_minor,
                    'currency' => $payment->currency,
                    'customer_email' => $order->customer_email,
                    'grand_total' => $order->grand_total,
                ]);

            if ($response->failed()) {
                Log::warning('Notificación de pago fallida', ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Throwable $exception) {
            Log::warning('Notificación de pago: '.$exception->getMessage());
        }
    }
}
