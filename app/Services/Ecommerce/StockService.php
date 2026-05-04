<?php

namespace App\Services\Ecommerce;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Inventory\InventoryLedgerService;
use Illuminate\Validation\ValidationException;

class StockService
{
    public function __construct(
        private InventoryLedgerService $inventory,
    ) {}

    public function assertEligibleLine(Product $product, ?ProductVariant $variant): void
    {
        if ($variant === null && $product->variants()->exists()) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'Debes elegir una variante.',
            ]);
        }

        if ($variant !== null && (int) $variant->product_id !== (int) $product->id) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'La variante no coincide con el producto.',
            ]);
        }
    }

    public function assertQuantityWithinStock(Product $product, ?ProductVariant $variant, int $quantity): void
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'La cantidad debe ser mayor a cero.',
            ]);
        }

        $available = $this->inventory->availableFor($product, $variant);

        if ($quantity > $available) {
            throw ValidationException::withMessages([
                'quantity' => 'Stock insuficiente para '.$product->name.'.',
            ]);
        }
    }

    public function reserveForOrderLine(Order $order, Product $product, ?ProductVariant $variant, int $quantity): void
    {
        $this->assertEligibleLine($product, $variant);
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'La cantidad debe ser mayor a cero.',
            ]);
        }

        $this->inventory->reserveForOrderLine($order, $product, $variant, $quantity);
    }
}
