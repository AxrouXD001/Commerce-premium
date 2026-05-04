<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Order
 */
class CustomerOrderSummaryResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : (string) $this->status,
            'currency' => $this->currency,
            'grand_total' => (float) $this->grand_total,
            'customer_email' => $this->customer_email,
            'customer_name' => $this->customer_name,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
