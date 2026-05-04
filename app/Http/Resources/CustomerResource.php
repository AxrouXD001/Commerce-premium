<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Customer
 */
class CustomerResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone' => $this->phone,
            'company' => $this->company,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : (string) $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'segments' => SegmentResource::collection($this->whenLoaded('segments')),
            'addresses' => CustomerAddressResource::collection($this->whenLoaded('addresses')),
            'notes' => CustomerNoteResource::collection($this->whenLoaded('notes')),
            'orders_count' => $this->whenCounted('orders'),
            'orders_sum_grand_total' => $this->whenAggregated('orders', 'grand_total', 'sum'),
        ];
    }
}
