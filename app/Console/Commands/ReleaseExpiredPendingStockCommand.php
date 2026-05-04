<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Console\Command;

class ReleaseExpiredPendingStockCommand extends Command
{
    protected $signature = 'inventory:release-expired-pending-orders';

    protected $description = 'Cancela pedidos pendientes de pago vencidos y libera reservas de inventario';

    public function handle(): int
    {
        $days = (int) config('inventory.pendiente_order_ttl_days', 7);
        $cutoff = now()->subDays($days);

        $count = 0;

        Order::query()
            ->where('status', OrderStatus::Pendiente)
            ->where('created_at', '<', $cutoff)
            ->orderBy('id')
            ->chunkById(50, function ($orders) use (&$count): void {
                foreach ($orders as $order) {
                    /** @var Order $order */
                    $order->update(['status' => OrderStatus::Cancelado]);
                    $count++;
                }
            });

        $this->info("Pedidos cancelados por expiración: {$count}");

        return self::SUCCESS;
    }
}
