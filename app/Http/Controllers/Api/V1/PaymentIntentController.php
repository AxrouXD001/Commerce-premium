<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PaymentSetupRequest;
use App\Models\Order;
use App\Services\Payments\StripePaymentIntentService;
use Illuminate\Http\JsonResponse;

class PaymentIntentController extends Controller
{
    public function store(PaymentSetupRequest $request, StripePaymentIntentService $stripePayments): JsonResponse
    {
        $validated = $request->validated();

        /** @var Order $order */
        $order = Order::query()
            ->where('order_number', $validated['order_number'])
            ->firstOrFail();

        $intent = $stripePayments->beginForOrder($order, $validated['payment_setup_secret']);

        return response()->json([
            'payment_id' => $intent['payment']->getKey(),
            'client_secret' => $intent['client_secret'],
            'stripe_publishable_key' => config('services.stripe.key'),
        ]);
    }
}
