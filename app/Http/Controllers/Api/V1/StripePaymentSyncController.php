<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PaymentIntentSyncRequest;
use App\Services\Payments\StripeWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class StripePaymentSyncController extends Controller
{
    public function store(PaymentIntentSyncRequest $request, StripeWebhookProcessor $processor): JsonResponse
    {
        Stripe::setApiKey((string) config('services.stripe.secret'));

        $id = $request->validated('payment_intent_id');
        $setupSecret = $request->validated('payment_setup_secret');

        try {
            /** @var PaymentIntent $intent */
            $intent = PaymentIntent::retrieve($id);
        } catch (ApiErrorException) {
            return response()->json(['message' => 'No se pudo consultar el intent de pago.'], 404);
        }

        if ($intent->status !== 'succeeded') {
            return response()->json([
                'message' => 'El pago aún no se completó en Stripe.',
                'payment_intent_status' => $intent->status,
            ], 409);
        }

        $result = $processor->finalizeSucceededPaymentIntent($intent, null, $setupSecret);

        if ($result === null) {
            return response()->json([
                'message' => 'No hay un cobro registrado para este intent de Stripe.',
            ], 404);
        }

        $receiptPageUrl = route('orders.receipt', ['order' => $result['order_number']])
            . '?token='.rawurlencode($result['receipt_access_token']);

        return response()->json([
            'ok' => true,
            'receipt_access_token' => $result['receipt_access_token'],
            'receipt_page_url' => $receiptPageUrl,
        ]);
    }
}
