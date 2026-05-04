<?php

namespace App\Http\Resources;

use App\Models\ProductVariant;
use App\Services\Ecommerce\ProductPricingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CartItem
 */
class CartItemResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $item = $this->resource;
        /** @phpstan-ignore-next-line */
        $product = $item->product;
        /** @phpstan-ignore-next-line */
        $variant = $item->product_variant_id !== null ? $item->productVariant : null;

        $pricing = app(ProductPricingService::class);

        /** @var ProductVariant|null $activeVariant */
        $activeVariant = $variant instanceof ProductVariant ? $variant : null;

        $unitPrice = $pricing->unitSalePrice($product, $activeVariant);
        $lineSubtotal = $pricing->lineTotal($unitPrice, (int) $this->quantity);

        $firstImageUrl = null;
        if ($product->relationLoaded('images')) {
            $firstImageUrl = optional($product->images->first())->url ?? null;
        }

        return [
            'id' => $this->id,
            'quantity' => (int) $this->quantity,
            'unit_price' => (float) $unitPrice,
            'line_subtotal' => (float) $lineSubtotal,
            'product' => [
                'id' => $product->getKey(),
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'image_url' => $firstImageUrl,
            ],
            'variant' => $activeVariant !== null ? [
                'id' => $activeVariant->getKey(),
                'name' => $activeVariant->name,
                'sku' => $activeVariant->sku,
            ] : null,
        ];
    }
}
