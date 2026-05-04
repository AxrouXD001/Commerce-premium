<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Recibo {{ $order->order_number }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }
        th, td {
            border: 1px solid #bbb;
            padding: 6px 8px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: bold;
        }
        .muted { color: #555; }
        .total { margin-top: 16px; font-size: 14px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Recibo — {{ config('app.name') }}</h1>
    <p class="muted">Pedido <strong>{{ $order->order_number }}</strong></p>
    <p class="muted">Emitido {{ $issuedAt->timezone(config('app.timezone'))->format('d/m/Y H:i') }}</p>
    <p class="muted">Pago externo Stripe: <strong>{{ $payment->external_id }}</strong> ({{ $payment->status->value }})</p>
    <hr>
    <p><strong>Cliente:</strong>
        {{ $order->customer_name ?? '—' }}<br>
        <strong>Correo:</strong> {{ $order->customer_email ?? '—' }}
    </p>
    @if ($order->notes_customer)
        <p class="muted"><strong>Notas:</strong> {{ $order->notes_customer }}</p>
    @endif

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>P. unitario</th>
                <th>Subtotal línea</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name_snapshot }}
                        @if ($item->variant_name_snapshot)
                            <span class="muted"> · {{ $item->variant_name_snapshot }}</span>
                        @endif
                    </td>
                    <td>{{ $item->sku_snapshot }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format((float) $item->unit_price, 2) }} {{ $order->currency }}</td>
                    <td>{{ number_format((float) $item->line_subtotal, 2) }} {{ $order->currency }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="muted" style="margin-top:14px;">Subtotal: {{ number_format((float) $order->subtotal, 2) }} {{ $order->currency }}</p>
    <p class="muted">Descuentos: −{{ number_format((float) $order->discount_total, 2) }} {{ $order->currency }}</p>
    <p class="muted">Impuestos (snapshot): {{ number_format((float) $order->tax_total, 2) }} {{ $order->currency }}</p>
    <p class="total">Total cobrado: {{ number_format((float) $order->grand_total, 2) }} {{ $order->currency }}</p>
</body>
</html>
