<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class OrderConfirmationController extends Controller
{
    public function __invoke(Order $order): Response
    {
        return Inertia::render('checkout/order-confirmation', [
            'order' => (new OrderResource($order->load('items')))->resolve(),
        ]);
    }
}
