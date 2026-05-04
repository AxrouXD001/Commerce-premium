<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderReceiptPdfController extends Controller
{
    public function show(Request $request, Order $order): StreamedResponse
    {
        $token = (string) $request->query('token', '');
        $user = $request->user();

        $ownsAsUser = $user !== null && (int) $order->user_id === (int) $user->getKey();
        $ownsWithToken = $order->receipt_access_token !== null && $token !== ''
            && hash_equals((string) $order->receipt_access_token, $token);

        if (! $ownsAsUser && ! $ownsWithToken) {
            abort(403, 'Sin permiso para descargar el recibo.');
        }

        $path = $order->receipt_path;
        if ($path === null || $path === '') {
            abort(404, 'El recibo aún no está disponible.');
        }

        if (! Storage::disk('local')->exists($path)) {
            abort(404, 'Archivo de recibo no encontrado.');
        }

        return response()->streamDownload(function () use ($path): void {
            $absolute = Storage::disk('local')->path($path);
            $fh = fopen($absolute, 'rb');
            if ($fh !== false) {
                fpassthru($fh);
                fclose($fh);
            }
        }, basename($path), [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
