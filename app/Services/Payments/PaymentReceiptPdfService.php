<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;

class PaymentReceiptPdfService
{
    public function generate(Order $order, Payment $payment): string
    {
        $relativePath = sprintf('receipts/%s.pdf', $order->order_number);

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $dompdf = new Dompdf($options);

        $html = View::make('pdf.order-receipt', [
            'order' => $order->loadMissing('items'),
            'payment' => $payment,
            'issuedAt' => now(),
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        Storage::disk('local')->put($relativePath, $dompdf->output());

        return $relativePath;
    }
}
