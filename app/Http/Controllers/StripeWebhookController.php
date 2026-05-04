<?php

namespace App\Http\Controllers;

use App\Services\Payments\StripeWebhookProcessor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Webhook público Stripe (firmado). Mantener RAW body intacto para verificación HMAC.
     */
    public function __invoke(Request $request, StripeWebhookProcessor $processor): Response
    {
        $payload = $request->getContent();
        $secret = (string) config('services.stripe.webhook_secret');
        $sigHeader = $request->header('Stripe-Signature');

        if ($secret === '' || $sigHeader === null) {
            abort(503, 'Stripe webhook no configurado.');
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
            $processor->handle($event);
        } catch (SignatureVerificationException) {
            abort(400, 'Firma Stripe inválida.');
        }

        return response('', 204);
    }
}
