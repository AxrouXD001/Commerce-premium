<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\OrderItem
 */
class OrderItemResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'product_name' => $this->product_name_snapshot,
            'variant_name' => $this->variant_name_snapshot,
            'sku' => $this->sku_snapshot,
            'quantity' => (int) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'line_subtotal' => (float) $this->line_subtotal,
        ];
    }
}
