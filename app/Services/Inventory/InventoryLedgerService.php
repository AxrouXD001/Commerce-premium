<?php

namespace App\Services\Inventory;

use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryLedgerService
{
    public function __construct(
        private InventorySocketBroadcaster $socketBroadcaster,
    ) {}

    public function defaultWarehouseId(): int
    {
        static $id = null;

        if ($id !== null) {
            return $id;
        }

        $found = Warehouse::query()->where('is_default', true)->value('id');
        if ($found === null) {
            throw new \RuntimeException('No hay almacén por defecto (warehouses).');
        }

        $id = (int) $found;

        return $id;
    }

    public function variantKey(?int $variantId): int
    {
        return $variantId ?? 0;
    }

    public function availableFor(Product $product, ?ProductVariant $variant): int
    {
        $wid = $this->defaultWarehouseId();
        $vk = $this->variantKey($variant?->getKey());

        $row = Inventory::query()
            ->where('warehouse_id', $wid)
            ->where('product_id', $product->getKey())
            ->where('product_variant_key', $vk)
            ->first();

        if ($row === null) {
            return $this->fallbackCatalogAvailable($product, $variant);
        }

        return $row->available();
    }

    /**
     * Crea filas de inventario para un producto recién creado o tras nuevas variantes.
     */
    public function ensureRowsForProduct(Product $product): void
    {
        $wid = $this->defaultWarehouseId();
        $product->loadMissing('variants');

        if ($product->variants->isNotEmpty()) {
            foreach ($product->variants as $variant) {
                Inventory::query()->firstOrCreate(
                    [
                        'warehouse_id' => $wid,
                        'product_id' => $product->getKey(),
                        'product_variant_key' => $variant->getKey(),
                    ],
                    [
                        'on_hand' => max(0, (int) $variant->stock),
                        'reserved' => 0,
                        'reorder_point' => (int) config('inventory.reorder_point_default'),
                    ],
                );
            }

            return;
        }

        Inventory::query()->firstOrCreate(
            [
                'warehouse_id' => $wid,
                'product_id' => $product->getKey(),
                'product_variant_key' => 0,
            ],
            [
                'on_hand' => max(0, (int) $product->stock),
                'reserved' => 0,
                'reorder_point' => (int) config('inventory.reorder_point_default'),
            ],
        );
    }

    /**
     * Copia stock del catálogo (productos/variantes) hacia on_hand del inventario.
     */
    public function syncOnHandFromCatalogProduct(Product $product): void
    {
        $this->ensureRowsForProduct($product);
        $wid = $this->defaultWarehouseId();
        $product->loadMissing('variants');

        if ($product->variants->isNotEmpty()) {
            foreach ($product->variants as $variant) {
                $row = $this->lockInventoryRow($wid, (int) $product->getKey(), (int) $variant->getKey());
                $newOnHand = max((int) $row->reserved, (int) $variant->stock);
                $delta = $newOnHand - (int) $row->on_hand;
                if ($delta !== 0) {
                    $row->forceFill(['on_hand' => $newOnHand])->save();
                    $this->recordMovement(
                        $row,
                        StockMovementType::Adjust,
                        $delta,
                        0,
                        'catalog',
                        (int) $product->getKey(),
                        'Sincronización desde catálogo',
                    );
                }
                $this->syncDenormalizedVariantStock($variant, $row);
            }

            $this->refreshParentProductStockAggregate($product);

            return;
        }

        $row = $this->lockInventoryRow($wid, (int) $product->getKey(), 0);
        $newOnHand = max((int) $row->reserved, (int) $product->stock);
        $delta = $newOnHand - (int) $row->on_hand;
        if ($delta !== 0) {
            $row->forceFill(['on_hand' => $newOnHand])->save();
            $this->recordMovement(
                $row,
                StockMovementType::Adjust,
                $delta,
                0,
                'catalog',
                (int) $product->getKey(),
                'Sincronización desde catálogo',
            );
        }
        $this->syncDenormalizedSimpleProduct($product, $row);
    }

    public function reserveForOrderLine(Order $order, Product $product, ?ProductVariant $variant, int $quantity): void
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'La cantidad debe ser mayor a cero.',
            ]);
        }

        $this->ensureRowsForProduct($product->fresh(['variants']));

        $wid = $this->defaultWarehouseId();
        $vk = $this->variantKey($variant?->getKey());

        $row = $this->lockInventoryRow($wid, (int) $product->getKey(), $vk);

        if ($row->available() < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'Stock insuficiente para '.$product->name.'.',
            ]);
        }

        $row->increment('reserved', $quantity);
        $row->refresh();

        $this->recordMovement(
            $row,
            StockMovementType::Reserve,
            0,
            $quantity,
            'order',
            (int) $order->getKey(),
            'Reserva por pedido '.$order->order_number,
        );

        $this->syncDenormalizedForRow($product, $variant, $row);
        $this->socketBroadcaster->publishStockUpdate((int) $product->getKey(), $vk, $row->available());
    }

    public function commitPaidOrder(Order $order): void
    {
        $order->loadMissing('items');

        $sorted = $order->items->sortBy(function (OrderItem $item): string {
            $vid = $item->product_variant_id !== null
                ? str_pad((string) $item->product_variant_id, 8, '0', STR_PAD_LEFT)
                : '00000000';

            return str_pad((string) $item->product_id, 8, '0', STR_PAD_LEFT).'-'.$vid;
        })->values();

        foreach ($sorted as $item) {
            $this->commitOrderItem($order, $item);
        }
    }

    public function releaseReservationForOrder(Order $order): void
    {
        $order->loadMissing('items');

        $sorted = $order->items->sortBy(function (OrderItem $item): string {
            $vid = $item->product_variant_id !== null
                ? str_pad((string) $item->product_variant_id, 8, '0', STR_PAD_LEFT)
                : '00000000';

            return str_pad((string) $item->product_id, 8, '0', STR_PAD_LEFT).'-'.$vid;
        })->values();

        foreach ($sorted as $item) {
            $this->releaseOrderItem($order, $item);
        }
    }

    public function restockCommittedLinesForOrder(Order $order): void
    {
        $order->loadMissing('items');

        $sorted = $order->items->sortBy(function (OrderItem $item): string {
            $vid = $item->product_variant_id !== null
                ? str_pad((string) $item->product_variant_id, 8, '0', STR_PAD_LEFT)
                : '00000000';

            return str_pad((string) $item->product_id, 8, '0', STR_PAD_LEFT).'-'.$vid;
        })->values();

        foreach ($sorted as $item) {
            $this->restockOrderItem($order, $item);
        }
    }

    public function handleOrderCancelled(Order $order, string $previousStatusValue): void
    {
        $previous = OrderStatus::tryFrom($previousStatusValue);

        if ($previous === null) {
            return;
        }

        if ($previous === OrderStatus::Pendiente) {
            $this->releaseReservationForOrder($order);
        } elseif ($previous === OrderStatus::Confirmado) {
            $this->restockCommittedLinesForOrder($order);
        }
    }

    /**
     * @return array{inventory: Inventory, previous_available: int, new_available: int}
     */
    public function adjustOnHand(int $warehouseId, int $productId, int $productVariantKey, int $deltaOnHand, ?string $notes = null): array
    {
        if ($deltaOnHand === 0) {
            throw ValidationException::withMessages([
                'delta_on_hand' => 'El ajuste no puede ser cero.',
            ]);
        }

        return DB::transaction(function () use ($warehouseId, $productId, $productVariantKey, $deltaOnHand, $notes): array {
            $row = $this->lockInventoryRow($warehouseId, $productId, $productVariantKey);
            $prevAvailable = $row->available();
            $newOnHand = (int) $row->on_hand + $deltaOnHand;

            if ($newOnHand < (int) $row->reserved) {
                throw ValidationException::withMessages([
                    'delta_on_hand' => 'El stock físico no puede quedar por debajo de lo reservado ('.$row->reserved.').',
                ]);
            }

            if ($newOnHand < 0) {
                throw ValidationException::withMessages([
                    'delta_on_hand' => 'El stock físico no puede ser negativo.',
                ]);
            }

            $row->forceFill(['on_hand' => $newOnHand])->save();
            $row->refresh();

            $this->recordMovement(
                $row,
                StockMovementType::Adjust,
                $deltaOnHand,
                0,
                'manual',
                null,
                $notes,
            );

            $product = Product::query()->with('variants')->findOrFail($productId);
            $variant = $productVariantKey > 0
                ? ProductVariant::query()->where('product_id', $productId)->whereKey($productVariantKey)->first()
                : null;

            $this->syncDenormalizedForRow($product, $variant, $row);

            $newAvailable = $row->available();
            $this->socketBroadcaster->publishStockUpdate($productId, $productVariantKey, $newAvailable);

            return [
                'inventory' => $row,
                'previous_available' => $prevAvailable,
                'new_available' => $newAvailable,
            ];
        });
    }

    protected function commitOrderItem(Order $order, OrderItem $item): void
    {
        $wid = $this->defaultWarehouseId();
        $vk = $this->variantKey($item->product_variant_id !== null ? (int) $item->product_variant_id : 0);

        $row = $this->lockInventoryRow($wid, (int) $item->product_id, $vk);

        if ((int) $row->reserved < (int) $item->quantity) {
            throw ValidationException::withMessages([
                'inventory' => 'Reserva insuficiente para confirmar el pedido '.$order->order_number.'.',
            ]);
        }

        $qty = (int) $item->quantity;

        $row->forceFill([
            'on_hand' => (int) $row->on_hand - $qty,
            'reserved' => (int) $row->reserved - $qty,
        ])->save();

        $row->refresh();

        $this->recordMovement(
            $row,
            StockMovementType::Commit,
            -$qty,
            -$qty,
            'order',
            (int) $order->getKey(),
            'Cobro confirmado '.$order->order_number,
        );

        $product = Product::query()->findOrFail((int) $item->product_id);
        $variant = $item->product_variant_id !== null
            ? ProductVariant::query()->whereKey((int) $item->product_variant_id)->first()
            : null;

        $this->syncDenormalizedForRow($product, $variant, $row);
        $this->socketBroadcaster->publishStockUpdate((int) $product->getKey(), $vk, $row->available());
    }

    protected function releaseOrderItem(Order $order, OrderItem $item): void
    {
        $wid = $this->defaultWarehouseId();
        $vk = $this->variantKey($item->product_variant_id !== null ? (int) $item->product_variant_id : 0);

        $row = $this->lockInventoryRow($wid, (int) $item->product_id, $vk);
        $qty = min((int) $item->quantity, (int) $row->reserved);

        if ($qty < 1) {
            return;
        }

        $row->decrement('reserved', $qty);
        $row->refresh();

        $this->recordMovement(
            $row,
            StockMovementType::Release,
            0,
            -$qty,
            'order',
            (int) $order->getKey(),
            'Liberación por cancelación '.$order->order_number,
        );

        $product = Product::query()->findOrFail((int) $item->product_id);
        $variant = $item->product_variant_id !== null
            ? ProductVariant::query()->whereKey((int) $item->product_variant_id)->first()
            : null;

        $this->syncDenormalizedForRow($product, $variant, $row);
        $this->socketBroadcaster->publishStockUpdate((int) $product->getKey(), $vk, $row->available());
    }

    protected function restockOrderItem(Order $order, OrderItem $item): void
    {
        $wid = $this->defaultWarehouseId();
        $vk = $this->variantKey($item->product_variant_id !== null ? (int) $item->product_variant_id : 0);

        $row = $this->lockInventoryRow($wid, (int) $item->product_id, $vk);
        $qty = (int) $item->quantity;

        $row->increment('on_hand', $qty);
        $row->refresh();

        $this->recordMovement(
            $row,
            StockMovementType::Restock,
            $qty,
            0,
            'order',
            (int) $order->getKey(),
            'Reingreso por cancelación post-venta '.$order->order_number,
        );

        $product = Product::query()->findOrFail((int) $item->product_id);
        $variant = $item->product_variant_id !== null
            ? ProductVariant::query()->whereKey((int) $item->product_variant_id)->first()
            : null;

        $this->syncDenormalizedForRow($product, $variant, $row);
        $this->socketBroadcaster->publishStockUpdate((int) $product->getKey(), $vk, $row->available());
    }

    protected function lockInventoryRow(int $warehouseId, int $productId, int $variantKey): Inventory
    {
        /** @var Inventory|null $row */
        $row = Inventory::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->where('product_variant_key', $variantKey)
            ->lockForUpdate()
            ->first();

        if ($row === null) {
            throw ValidationException::withMessages([
                'inventory' => 'No hay registro de inventario para el producto.',
            ]);
        }

        return $row;
    }

    protected function recordMovement(
        Inventory $row,
        StockMovementType $type,
        int $changeOnHand,
        int $changeReserved,
        ?string $referenceType,
        ?int $referenceId,
        ?string $notes,
    ): void {
        StockMovement::query()->create([
            'warehouse_id' => $row->warehouse_id,
            'product_id' => $row->product_id,
            'product_variant_key' => $row->product_variant_key,
            'type' => $type,
            'change_on_hand' => $changeOnHand,
            'change_reserved' => $changeReserved,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
        ]);
    }

    protected function syncDenormalizedForRow(Product $product, ?ProductVariant $variant, Inventory $row): void
    {
        $available = $row->available();

        if ($variant instanceof ProductVariant) {
            ProductVariant::query()->whereKey($variant->getKey())->update(['stock' => $available]);
        } else {
            Product::query()->whereKey($product->getKey())->update(['stock' => $available]);
        }
    }

    protected function syncDenormalizedVariantStock(ProductVariant $variant, Inventory $row): void
    {
        ProductVariant::query()->whereKey($variant->getKey())->update(['stock' => $row->available()]);
    }

    protected function syncDenormalizedSimpleProduct(Product $product, Inventory $row): void
    {
        Product::query()->whereKey($product->getKey())->update(['stock' => $row->available()]);
    }

    protected function refreshParentProductStockAggregate(Product $product): void
    {
        $wid = $this->defaultWarehouseId();
        $sum = (int) Inventory::query()
            ->where('warehouse_id', $wid)
            ->where('product_id', $product->getKey())
            ->where('product_variant_key', '>', 0)
            ->get()
            ->sum(fn (Inventory $r): int => $r->available());

        Product::query()->whereKey($product->getKey())->update(['stock' => max(0, $sum)]);
    }

    protected function fallbackCatalogAvailable(Product $product, ?ProductVariant $variant): int
    {
        if ($variant instanceof ProductVariant) {
            return max(0, (int) $variant->stock);
        }

        return max(0, (int) $product->stock);
    }
}
