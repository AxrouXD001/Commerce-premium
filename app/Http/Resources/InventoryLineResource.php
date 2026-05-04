<?php

namespace App\Http\Resources;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Inventory
 */
class InventoryLineResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $variantKey = (int) $this->product_variant_key;

        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'product_variant_key' => $variantKey,
            'product_name' => $this->whenLoaded('product', fn () => (string) $this->product->name),
            'sku' => $this->resolveSku($variantKey),
            'on_hand' => (int) $this->on_hand,
            'reserved' => (int) $this->reserved,
            'available' => $this->available(),
            'reorder_point' => (int) $this->reorder_point,
        ];
    }

    protected function resolveSku(int $variantKey): string
    {
        if ($variantKey > 0) {
            $sku = ProductVariant::query()
                ->where('product_id', $this->product_id)
                ->whereKey($variantKey)
                ->value('sku');

            return $sku !== null ? (string) $sku : '';
        }

        if ($this->relationLoaded('product') && $this->product !== null) {
            return (string) $this->product->sku;
        }

        return '';
    }
}
