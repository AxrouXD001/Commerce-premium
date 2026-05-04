<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\InventoryAdjustRequest;
use App\Http\Resources\InventoryLineResource;
use App\Services\Inventory\InventoryLedgerService;

class InventoryAdjustController extends Controller
{
    public function store(InventoryAdjustRequest $request, InventoryLedgerService $ledger): InventoryLineResource
    {
        $validated = $request->validated();

        $warehouseId = isset($validated['warehouse_id'])
            ? (int) $validated['warehouse_id']
            : $ledger->defaultWarehouseId();

        $variantKey = (int) ($validated['product_variant_key'] ?? 0);

        $result = $ledger->adjustOnHand(
            $warehouseId,
            (int) $validated['product_id'],
            $variantKey,
            (int) $validated['delta_on_hand'],
            $validated['notes'] ?? null,
        );

        return new InventoryLineResource($result['inventory']->loadMissing('product:id,name,sku'));
    }
}
