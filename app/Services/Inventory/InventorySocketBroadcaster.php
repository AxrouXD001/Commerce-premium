<?php

namespace App\Services\Inventory;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InventorySocketBroadcaster
{
    /**
     * Notifica al servicio Node (Socket.IO) un cambio de stock disponible.
     */
    public function publishStockUpdate(int $productId, int $productVariantKey, int $available): void
    {
        $url = config('services.inventory_socket.emit_url');
        $token = config('services.inventory_socket.token');

        if (! is_string($url) || $url === '') {
            return;
        }

        try {
            Http::timeout(3)
                ->withToken(is_string($token) ? $token : '')
                ->post($url, [
                    'event' => 'inventory:stock',
                    'product_id' => $productId,
                    'product_variant_key' => $productVariantKey,
                    'available' => $available,
                ]);
        } catch (\Throwable $exception) {
            Log::debug('inventory-socket: '.$exception->getMessage());
        }
    }

    /**
     * @param  list<array{product_id: int, product_variant_key: int, available: int, reorder_point: int}>  $lines
     */
    public function publishLowStockBatch(array $lines): void
    {
        $url = config('services.inventory_socket.emit_url');
        $token = config('services.inventory_socket.token');

        if (! is_string($url) || $url === '' || $lines === []) {
            return;
        }

        try {
            Http::timeout(5)
                ->withToken(is_string($token) ? $token : '')
                ->post($url, [
                    'event' => 'inventory:low_stock',
                    'lines' => $lines,
                ]);
        } catch (\Throwable $exception) {
            Log::debug('inventory-socket low_stock: '.$exception->getMessage());
        }
    }
}
