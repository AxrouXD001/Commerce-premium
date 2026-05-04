<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Services\Inventory\InventorySocketBroadcaster;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CheckLowInventoryJob implements ShouldQueue
{
    use Queueable;

    public function handle(InventorySocketBroadcaster $socket): void
    {
        $lines = [];

        Inventory::query()
            ->with(['product:id'])
            ->whereHas('product', function ($q): void {
                $q->whereNull('deleted_at');
            })
            ->whereRaw('(on_hand - reserved) <= reorder_point')
            ->orderBy('id')
            ->limit(200)
            ->get()
            ->each(function (Inventory $inventory) use (&$lines): void {
                $lines[] = [
                    'product_id' => (int) $inventory->product_id,
                    'product_variant_key' => (int) $inventory->product_variant_key,
                    'available' => $inventory->available(),
                    'reorder_point' => (int) $inventory->reorder_point,
                ];

                $inventory->forceFill(['last_low_stock_alert_at' => now()])->save();
            });

        if ($lines !== []) {
            Log::info('Inventario bajo mínimo', ['lines' => count($lines)]);
            $socket->publishLowStockBatch($lines);
        }
    }
}
