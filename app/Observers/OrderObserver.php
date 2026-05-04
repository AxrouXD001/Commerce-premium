<?php

namespace App\Observers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\Inventory\InventoryLedgerService;

class OrderObserver
{
    public function __construct(
        private InventoryLedgerService $inventoryLedger,
    ) {}

    public function created(Order $order): void
    {
        OrderStatusHistory::query()->create([
            'order_id' => $order->getKey(),
            'status' => $order->status,
            'notes' => 'Pedido creado',
            'changed_by' => auth()->id(),
        ]);
    }

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        OrderStatusHistory::query()->create([
            'order_id' => $order->getKey(),
            'status' => $order->status,
            'notes' => 'Cambio de estado',
            'changed_by' => auth()->id(),
        ]);

        $previous = $order->getRawOriginal('status');

        if (! is_string($previous)) {
            return;
        }

        if ($order->status === OrderStatus::Cancelado && $previous !== OrderStatus::Cancelado->value) {
            $this->inventoryLedger->handleOrderCancelled($order, $previous);
        }
    }
}
