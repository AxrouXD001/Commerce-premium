<?php

namespace App\Services\Ecommerce;

use App\Models\Product;
use App\Models\ProductVariant;

class ProductPricingService
{
    /**
     * @return numeric-string
     */
    public function unitSalePrice(Product $product, ?ProductVariant $variant): string
    {
        $base = (float) $product->price;
        $adj = $variant ? (float) $variant->price_adjustment : 0.0;

        return number_format(round($base + $adj, 2), 2, '.', '');
    }

    /**
     * @param  numeric-string  $unitPrice
     * @return numeric-string
     */
    public function lineTotal(string $unitPrice, int $quantity): string
    {
        $total = bcmul((string) $unitPrice, (string) $quantity, 3);

        return number_format(round((float) $total, 2), 2, '.', '');
    }
}
