<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPaymentPageController extends Controller
{
    public function __invoke(Order $order): Response
    {
        return Inertia::render('checkout/payment', [
            'order' => [
                'order_number' => $order->order_number,
                'grand_total' => (float) $order->grand_total,
                'currency' => $order->currency,
                'status' => $order->status->value,
            ],
        ]);
    }
}
