<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderReceiptPageController extends Controller
{
    public function __invoke(Request $request, Order $order): Response
    {
        $token = (string) $request->query('token', '');
        $user = $request->user();

        $ownsAsUser = $user !== null && (int) $order->user_id === (int) $user->getKey();
        $ownsWithToken = $order->receipt_access_token !== null && $token !== ''
            && hash_equals((string) $order->receipt_access_token, $token);

        $authorized = $ownsAsUser || $ownsWithToken;

        $pdfUrl = null;
        if ($authorized && $order->receipt_path) {
            $pdfUrl = route('api.orders.receipt.pdf', ['order' => $order]);
            if (! $ownsAsUser && $ownsWithToken) {
                $pdfUrl .= '?token='.rawurlencode($token);
            }
        }

        return Inertia::render('orders/receipt', [
            'order' => [
                'order_number' => $order->order_number,
                'grand_total' => (float) $order->grand_total,
                'currency' => $order->currency,
                'status' => $order->status->value,
            ],
            'receipt_pdf_url' => $pdfUrl,
        ]);
    }
}
